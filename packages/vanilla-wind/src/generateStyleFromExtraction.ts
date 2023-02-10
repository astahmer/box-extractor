import { box, BoxNode, BoxNodeMap, isPrimitiveType, LiteralValue, PropNodesMap, unbox } from "@box-extractor/core";
import { createLogger } from "@box-extractor/logger";
import { ComplexStyleRule, globalStyle, GlobalStyleRule, style, StyleRule } from "@vanilla-extract/css";
import { deepMerge, isObject } from "pastable";
import { Node } from "ts-morph";
import type { GenericConfig, StyleOptions } from "./defineProperties";

const logger = createLogger("box-ex:vanilla-wind:generateStyleFromExtraction");

const cssCombinatorCharacters = new Set([">", "+", "~"]);
const cssAllowedFirstCharacterSelector = new Set([".", "#", "[", ":", "*"]);

const formatInnerSelector = (innerSelector: string) => {
    if (innerSelector.endsWith(" &")) {
        innerSelector = innerSelector.slice(0, -2);

        if (cssCombinatorCharacters.has(innerSelector.slice(-1))) {
            innerSelector = innerSelector + " *";
        }
    }

    if (innerSelector[0] === "&") {
        innerSelector = innerSelector.slice(1);
    }

    if (!cssAllowedFirstCharacterSelector.has(innerSelector[0]!)) {
        innerSelector = " " + innerSelector;
    }

    return innerSelector;
};

type LocalCssRule = {
    name: string;
    type: "local";
    rule: ComplexStyleRule;
    debugId: string | undefined;
};
type GlobalCssRule = {
    name: string;
    type: "global";
    rule: GlobalStyleRule;
    selector: string;
};

type CssRule = LocalCssRule | GlobalCssRule;

type GenerateRulesArgs = {
    name: string;
    extracted: PropNodesMap;
    config: GenericConfig;
    generateClassName: (cssRule: CssRule) => string | undefined;
    mode?: "atomic" | "grouped";
};

export function generateRulesFromExtraction({
    name,
    extracted,
    config,
    generateClassName,
    mode: _mode,
}: GenerateRulesArgs): {
    toReplace: Map<Node, string>;
    toRemove: Set<Node>;
    classByDebugId: Map<string, string>;
    rulesByDebugId: Map<string, StyleRule>;
    rulesByBoxNode: Map<BoxNode, Set<StyleRule>>;
} {
    const toReplace = new Map<Node, string>();
    const toRemove = new Set<Node>();

    const classByDebugId = new Map<string, string>();
    const rulesByDebugId = new Map<string, StyleRule>();
    const rulesByBoxNode = new Map<BoxNode, Set<StyleRule>>();

    const shorthandNames = new Set(Object.keys(config.shorthands ?? {}));
    const conditionNames = new Set(Object.keys(config.conditions ?? {}));
    const propertyNames = new Set(Object.keys(config.properties ?? {}));

    logger({ name, mode: _mode });

    extracted.queryList.forEach((query) => {
        const queryBox = query.box.isList() ? (query.box.value[0]! as BoxNodeMap) : query.box;
        if (!queryBox.isMap()) return;

        let options: StyleOptions | undefined;

        if (query.box.isList() && query.box.value[1] && query.box.value[1].isMap()) {
            const optionBoxMap = query.box.value[1];
            const maybeOptions = unbox(optionBoxMap);
            if (maybeOptions && isObject(maybeOptions)) {
                options = maybeOptions as StyleOptions;
            }
        }

        const selector = options?.selector;
        const mode = options?.mode ?? _mode ?? (selector ? "grouped" : "atomic");
        const classNameList = new Set<string>();

        const styleFn = selector
            ? (rule: GlobalStyleRule & Pick<StyleRule, "selectors">, innerSelector?: string | undefined) => {
                  if (innerSelector) {
                      innerSelector = innerSelector.split(",").map(formatInnerSelector).join(", ");
                  }

                  logger.scoped("style", { global: true, selector, innerSelector, rule });
                  generateClassName({ name, type: "global", rule, selector: `${selector}${innerSelector ?? ""}` });
              }
            : (rule: ComplexStyleRule, debugId?: string) => {
                  if (debugId && classByDebugId.has(debugId)) return;

                  const className = generateClassName({ name, type: "local", rule, debugId })!;
                  logger.scoped("style", { className, rule, debugId });
                  classNameList.add(className);

                  if (debugId) {
                      classByDebugId.set(debugId, className);
                  }

                  return className;
              };

        const argMap = new Map<string, BoxNode[]>();
        shorthandNames.forEach((shorthand) => {
            if (!queryBox.value.has(shorthand)) return;
            config.shorthands![shorthand]!.forEach((prop) => argMap.set(prop, queryBox.value.get(shorthand)!));
        });
        for (const [arg, nodeList] of queryBox.value.entries()) {
            if (shorthandNames.has(arg)) continue;
            argMap.set(arg, nodeList);
        }

        argMap.forEach((nodeList, argName) => {
            const processValue = (boxNode: BoxNode, path: string[] = []) => {
                if (argName === "vars" && path.length === 0 && boxNode.isMap()) {
                    const vars = unbox(boxNode);
                    if (vars && isObject(vars)) {
                        rulesByBoxNode.get(queryBox)!.add({ vars: vars as Record<string, string> });
                        return;
                    }
                }

                if (
                    box.isEmptyInitializer(boxNode) ||
                    box.isUnresolvable(boxNode) ||
                    (box.isObject(boxNode) && boxNode.isEmpty)
                ) {
                    return;
                }

                if (box.isLiteral(boxNode)) {
                    const primitive = boxNode.value;
                    if (!isNotNullish(primitive) || typeof primitive === "boolean") return;

                    if (path.length === 0) {
                        if (propertyNames.size > 0 && !propertyNames.has(argName)) {
                            return;
                        }

                        // use token value if defined / allow any CSS value if not
                        const propValues = config.properties?.[argName as keyof typeof config.properties];
                        const value =
                            propValues === true
                                ? primitive
                                : propValues?.[primitive as keyof typeof propValues] ?? primitive;

                        const debugId = `${name}_${argName}_${String(primitive)}`;
                        const rule = { [argName]: value } as StyleRule;

                        if (mode === "atomic") {
                            styleFn(rule, debugId);
                        }

                        rulesByDebugId.set(debugId, rule);
                        if (!rulesByBoxNode.has(queryBox)) {
                            rulesByBoxNode.set(queryBox, new Set());
                        }

                        rulesByBoxNode.get(queryBox)!.add(rule);

                        logger.scoped("style", { literal: true, debugId });
                        return;
                    }

                    const propNames = [] as string[];
                    // defineProperties({ properties: { ... } })
                    // only allow defined properties (makes sense right ?)
                    if (propertyNames.size > 0) {
                        if (propertyNames.has(argName)) {
                            propNames.push(argName);
                        } else {
                            path.forEach((prop) => {
                                if (propertyNames.has(prop)) {
                                    propNames.push(prop);
                                    return;
                                }

                                if (shorthandNames.has(prop)) {
                                    config.shorthands![prop]!.forEach((prop) => propNames.push(prop));
                                }
                            });
                        }

                        if (propNames.length === 0) return;
                        // defineProperties() or // defineProperties({ conditions: { ... } })
                        // allow any property
                    } else if (!conditionNames.has(argName)) {
                        propNames.push(argName);
                    } else {
                        const propName = path.find((prop) => !conditionNames.has(prop));
                        if (propName) {
                            propNames.push(propName);
                        }
                    }

                    propNames.forEach((propName) => {
                        const propValues = config.properties?.[propName as keyof typeof config.properties];
                        const value =
                            propValues === true
                                ? primitive
                                : propValues?.[primitive as keyof typeof propValues] ?? primitive;

                        const styleValue: StyleRule = { [propName]: value };
                        const rule: StyleRule = {};

                        const conditionPath = [] as string[];
                        const conditions = [] as string[];
                        const pseudoConditions = [] as string[];

                        let selector = "";
                        [argName, ...path].forEach((conditionName) => {
                            if (!conditionNames.has(conditionName)) return;

                            const condition = config.conditions![conditionName];
                            if (!condition) return;
                            conditionPath.push(conditionName);

                            if (condition["@supports"]) {
                                rule["@supports"] = {
                                    ...rule["@supports"],
                                    [condition["@supports"]]: styleValue,
                                };
                            }

                            if (condition["@container"]) {
                                rule["@container"] = {
                                    ...rule["@container"],
                                    [condition["@container"]]: styleValue,
                                };
                            }

                            if (condition["@media"]) {
                                rule["@media"] = {
                                    ...rule["@media"],
                                    [condition["@media"]]: styleValue,
                                };
                            }

                            if (condition.selector) {
                                const apply =
                                    condition.selector.startsWith(":") || condition.selector.startsWith("&:")
                                        ? "pseudo"
                                        : "selector";
                                if (apply === "pseudo") {
                                    pseudoConditions.push(condition.selector);
                                } else {
                                    conditions.push(
                                        condition.selector.endsWith(" &")
                                            ? condition.selector.slice(0, -1)
                                            : condition.selector
                                    );
                                }
                            }
                        });

                        selector = conditions.map((cond) => cond.trim()).join("");
                        if (pseudoConditions.length > 0) {
                            selector += " " + pseudoConditions.join("");
                        }

                        if (!selector.includes("&")) {
                            selector += " &";
                        }

                        rule.selectors = {
                            [selector]: styleValue,
                        };

                        const debugId = `${name}_${propName}_${conditionPath.join("_")}_${String(primitive)}`;

                        if (mode === "atomic") {
                            styleFn(rule, debugId);
                        }

                        rulesByDebugId.set(debugId, rule);
                        if (!rulesByBoxNode.has(queryBox)) {
                            rulesByBoxNode.set(queryBox, new Set());
                        }

                        rulesByBoxNode.get(queryBox)!.add(rule);

                        logger.scoped("style", { conditional: true, debugId });
                    });

                    return;
                }

                if (box.isMap(boxNode)) {
                    boxNode.value.forEach((propNodeList, propName) => {
                        propNodeList.forEach((propNode) => processValue(propNode, [...path, propName]));
                    });
                    return;
                }

                if (box.isObject(boxNode)) {
                    const processLiteralValue = (literal: LiteralValue, nestedPath: string[]) => {
                        if (Array.isArray(literal)) return;
                        if (isPrimitiveType(literal)) {
                            // TODO
                            // const debugId = `${name}_${argName}_${path.join("_")}_${propName}_${String(literal)}`;
                            // const className = styleFn({ [argName]: { [path.join("-")]: { [propName]: literal } } }, debugId);
                            // classMap.set(debugId, className);
                            // classNameList.add(className);
                            console.log({ TODO: true, name, argName, literal, nestedPath });
                            return;
                        }

                        if (typeof literal === "object") {
                            Object.entries(literal).forEach(([nestedPropName, nestedLiteral]) => {
                                processLiteralValue(nestedLiteral as any, [...nestedPath, nestedPropName]);
                            });
                        }
                    };

                    Object.entries(boxNode.value).forEach(([propName, literal]) => {
                        processLiteralValue(literal, [...path, propName]);
                    });

                    return;
                }

                if (box.isConditional(boxNode)) {
                    processValue(boxNode.whenTrue, path);
                    processValue(boxNode.whenFalse, path);
                    // console.log({ name, argName, path, box });
                    return;
                }

                if (box.isList(boxNode)) {
                    boxNode.value.forEach((listNode) => processValue(listNode, path));
                }
            };

            nodeList.forEach((box) => {
                processValue(box);

                if (extracted.kind === "component") {
                    const node = box.getNode();
                    if (Node.isJsxSpreadAttribute(node)) {
                        // TODO only remove the props needed rather than the whole spread, this is a bit too aggressive
                        toRemove.add(node);
                        return;
                    }

                    const jsxAttribute = box.getStack()[0];
                    if (Node.isJsxAttribute(jsxAttribute)) {
                        // don't remove anything if no known possible prop name were specified
                        if (propertyNames.size === 0 && shorthandNames.size === 0 && conditionNames.size === 0) return;

                        if (propertyNames.has(argName) || shorthandNames.has(argName) || conditionNames.has(argName)) {
                            toRemove.add(jsxAttribute);
                        }
                    }
                }
            });
        });

        const rules = rulesByBoxNode.get(queryBox)!;
        logger(rules);

        if (mode === "grouped") {
            // style fn
            if (!selector) {
                const merged = deepMerge(Array.from(rules));
                const grouped = styleFn(merged);
                logger.scoped("style", { name, grouped });

                if (grouped) {
                    toReplace.set(queryBox.getNode(), grouped);
                    classByDebugId.set(grouped, grouped);
                }

                return;
            }

            // globalStyle fn
            const selectors = Array.from(rules);
            const groupedRuleBySelector: Record<string, StyleRule> = {};
            const groupedRule: StyleRule = {};
            selectors.forEach((rule) => {
                if (rule.selectors) {
                    const key = Object.keys(rule.selectors)[0];
                    if (key) {
                        if (!groupedRuleBySelector[key]) {
                            groupedRuleBySelector[key] = {};
                        }

                        Object.assign(groupedRuleBySelector[key]!, rule.selectors[key]);
                    }
                } else {
                    Object.assign(groupedRule, rule);
                }
            });

            if (Object.keys(groupedRule).length > 0) {
                styleFn(groupedRule);
            }

            Object.entries(groupedRuleBySelector).forEach(([key, rule]) => {
                styleFn(rule, key);
            });

            toRemove.add(queryBox.getNode());

            return;
        }

        if (mode === "atomic" && classNameList.size > 0) {
            logger.scoped("style", { name, classNameList: classNameList.size });
            toReplace.set(queryBox.getNode(), Array.from(classNameList).join(" "));
        }
    });

    return { toReplace, toRemove, classByDebugId, rulesByDebugId, rulesByBoxNode };
}

export const generateStyleFromExtraction = (
    args: Omit<GenerateRulesArgs, "generateClassName">
): ReturnType<typeof generateRulesFromExtraction> & {
    allRules: Set<CssRule>;
} => {
    const allRules = new Set<CssRule>();
    const generateClassName = (cssRule: CssRule) => {
        allRules.add(cssRule);
        if (cssRule.type === "local") return style(cssRule.rule, cssRule.debugId);

        globalStyle(cssRule.selector, cssRule.rule);
    };

    const result = generateRulesFromExtraction({ ...args, generateClassName });
    return { ...result, allRules };
};

type Nullable<T> = T | null | undefined;
// TODO pastable
export const isNotNullish = <T>(element: Nullable<T>): element is T => element != null;
