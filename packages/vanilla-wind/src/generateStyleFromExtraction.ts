import { box, BoxNode, BoxNodeMap, isPrimitiveType, LiteralValue, ExtractResultItem, unbox } from "@box-extractor/core";
import { createLogger } from "@box-extractor/logger";
import { StyleRule, globalStyle, GlobalStyleRule, style } from "@vanilla-extract/css";
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

type BaseCssBox = {
    name: string;
    debugId: string;
};

type AtomicLocalCssBox = BaseCssBox & {
    type: "local";
    mode: "atomic";
    rule: StyleRule;
    propName: string;
    value: string | number;
    token: string | number | undefined;
    conditionPath?: string[];
};

type GroupedLocalCssBox = BaseCssBox & {
    type: "local";
    mode: "grouped";
    rule: StyleRule;
    fromRules: CssBox[];
};

type GroupedGlobalCssBox = Omit<GroupedLocalCssBox, "rule" | "type"> & {
    type: "global";
    rule: GlobalStyleRule;
    selector: string;
};

export type CssBox = AtomicLocalCssBox | GroupedLocalCssBox | GroupedGlobalCssBox;

type GenerateRulesArgs = {
    name: string;
    extracted: ExtractResultItem;
    config: GenericConfig;
    generateClassName: (config: CssBox) => string | undefined;
    getDebugId?: (args: GetDebugIdArgs) => string;
    getDebugIdGrouped?: (main: GetDebugIdGroupedArgs, list: GetDebugIdArgs[]) => string;
    classByDebugId?: Map<string, string>;
    mode?: "atomic" | "grouped";
};

export function generateRulesFromExtraction({
    name,
    extracted,
    config,
    generateClassName,
    getDebugId = defaultGetDebugId,
    getDebugIdGrouped = defaultGetDebugIdGrouped,
    classByDebugId = new Map<string, string>(),
    mode: _mode,
}: GenerateRulesArgs): {
    toReplace: Map<Node, string>;
    toRemove: Set<Node>;
    classByDebugId: Map<string, string>;
    rulesByDebugId: Map<string, CssBox>;
    rulesByBoxNode: Map<BoxNode, Set<CssBox>>;
    allRules: Set<CssBox>;
} {
    const toReplace = new Map<Node, string>();
    const toRemove = new Set<Node>();

    const rulesByDebugId = new Map<string, CssBox>();
    const rulesByBoxNode = new Map<BoxNode, Set<CssBox>>();
    const allRules = new Set<CssBox>();

    const shorthandNames = new Set(Object.keys(config.shorthands ?? {}));
    const conditionNames = new Set(Object.keys(config.conditions ?? {}));
    const propertyNames = new Set(Object.keys(config.properties ?? {}));

    logger({ name, mode: _mode });

    extracted.queryList.forEach((query) => {
        const queryBox = query.box.isList() ? (query.box.value[0]! as BoxNodeMap) : query.box;
        if (!queryBox.isMap()) return;

        if (!rulesByBoxNode.has(queryBox)) {
            rulesByBoxNode.set(queryBox, new Set());
        }

        let options: StyleOptions | undefined;

        if (query.box.isList() && query.box.value[1] && query.box.value[1].isMap()) {
            const optionBoxMap = query.box.value[1];
            const maybeOptions = unbox(optionBoxMap);
            if (maybeOptions && isObject(maybeOptions)) {
                options = maybeOptions as StyleOptions;
            }
        }

        const selector = options?.selector;
        const type = selector ? "global" : "local";
        // atomic global doesn't make sense, force it to grouped
        const mode = selector ? "grouped" : options?.mode ?? _mode ?? "atomic";

        const boxNodeClassList = new Set<string>();

        const styleFn = <TCssBox extends CssBox>(cssBox: TCssBox) => {
            const debugId = cssBox.debugId;

            if (cssBox.type === "local") {
                if (!rulesByDebugId.has(debugId)) {
                    allRules.add(cssBox);
                    rulesByDebugId.set(debugId, cssBox);
                }

                const rule = cssBox.rule;

                if (cssBox.mode === "atomic") {
                    const className = classByDebugId.get(debugId) ?? generateClassName(cssBox)!;
                    logger.scoped("local-atomic", { className, rule, debugId });
                    boxNodeClassList.add(className);
                    classByDebugId.set(debugId, className);

                    return className;
                }

                // grouped
                const fromRules = cssBox.fromRules;
                const className = classByDebugId.get(debugId) ?? generateClassName(cssBox)!;
                logger.scoped("local-grouped", { className, rule, fromRules });
                classByDebugId.set(debugId, className);
                boxNodeClassList.add(className);

                return className;
            }

            // global
            const rule = cssBox.rule;
            let innerSelector = cssBox.selector;

            if (innerSelector) {
                innerSelector = innerSelector.split(",").map(formatInnerSelector).join(", ");
            }

            const globalCssBox = { ...cssBox, selector: `${selector}${innerSelector ?? ""}` };
            if (!rulesByDebugId.has(debugId)) {
                rulesByDebugId.set(debugId, globalCssBox);
                allRules.add(globalCssBox);
            }

            generateClassName(globalCssBox);
            logger.scoped("global", { global: true, selector, innerSelector, rule });
        };

        const argMap = new Map<string, BoxNode>();
        shorthandNames.forEach((shorthand) => {
            if (!queryBox.value.has(shorthand)) return;
            config.shorthands![shorthand]!.forEach((prop) => argMap.set(prop, queryBox.value.get(shorthand)!));
        });
        for (const [arg, argValue] of queryBox.value.entries()) {
            if (shorthandNames.has(arg)) continue;
            argMap.set(arg, argValue);
        }

        argMap.forEach((argValue, argName) => {
            const processValue = (boxNode: BoxNode, path: string[] = []) => {
                if (argName === "vars" && path.length === 0 && boxNode.isMap()) {
                    const vars = unbox(boxNode);
                    if (vars && isObject(vars)) {
                        const debugValue = Object.keys(vars).length;
                        rulesByBoxNode.get(queryBox)!.add({
                            name,
                            type: selector ? "global" : "local",
                            mode: "atomic",
                            rule: { vars: vars as Record<string, string> },
                            propName: "vars",
                            value: debugValue,
                            token: debugValue,
                            debugId: getDebugId({
                                name,
                                type: "local",
                                count: allRules.size,
                                propName: "vars",
                                token: debugValue,
                            }),
                        } as AtomicLocalCssBox);
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

                    logger.scoped("literal", {
                        argName,
                        primitive,
                        path,
                        hasProp: propertyNames.has(argName),
                        propertyNames: propertyNames.size,
                    });

                    if (path.length === 0) {
                        if (propertyNames.size > 0 && !propertyNames.has(argName)) {
                            logger.scoped("skip", "unlisted prop", { argName, primitive });
                            return;
                        }

                        // use token value if defined / allow any CSS value if not
                        const propValues = config.properties?.[argName as keyof typeof config.properties];
                        const value =
                            propValues === true
                                ? primitive
                                : propValues?.[primitive as keyof typeof propValues] ?? primitive;

                        const debugId = getDebugId({
                            name,
                            type,
                            count: allRules.size,
                            propName: argName,
                            token: primitive,
                        });
                        const cssBox = {
                            name,
                            type,
                            mode: "atomic",
                            rule: { [argName]: value } as StyleRule,
                            debugId,
                            propName: argName,
                            value,
                            token: primitive,
                        } as AtomicLocalCssBox;

                        if (mode === "atomic") {
                            styleFn(cssBox);
                        } else if (mode === "grouped") {
                            rulesByBoxNode.get(queryBox)!.add(cssBox);
                        }

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

                        const debugId = getDebugId({
                            name,
                            type,
                            count: allRules.size,
                            propName,
                            conditionPath,
                            token: primitive,
                        });
                        const cssBox = {
                            name,
                            type,
                            mode: "atomic",
                            rule,
                            debugId,
                            propName,
                            value,
                            token: primitive,
                            conditionPath,
                        } as AtomicLocalCssBox;

                        if (mode === "atomic") {
                            styleFn(cssBox);
                        } else if (mode === "grouped") {
                            rulesByBoxNode.get(queryBox)!.add(cssBox);
                        }

                        logger.scoped("style", { conditional: true, debugId });
                    });

                    return;
                }

                if (box.isMap(boxNode)) {
                    boxNode.value.forEach((propNode, propName) => {
                        processValue(propNode, [...path, propName]);
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

            processValue(argValue);

            if (extracted.kind === "component") {
                const node = argValue.getNode();
                if (Node.isJsxSpreadAttribute(node)) {
                    // TODO only remove the props needed rather than the whole spread, this is a bit too aggressive
                    toRemove.add(node);
                    return;
                }

                const jsxAttribute = argValue.getStack()[0];
                if (Node.isJsxAttribute(jsxAttribute)) {
                    // don't remove anything if no known possible prop name were specified
                    if (propertyNames.size === 0 && shorthandNames.size === 0 && conditionNames.size === 0) return;

                    if (propertyNames.has(argName) || shorthandNames.has(argName) || conditionNames.has(argName)) {
                        toRemove.add(jsxAttribute);
                    }
                }
            }
        });

        const rules = rulesByBoxNode.get(queryBox)!;
        const rulesList = Array.from(rules ?? []);
        logger(rules);

        if (rules.size === 0) {
            rulesByBoxNode.delete(queryBox);
        }

        // console.log({
        //     name,
        //     mode,
        //     rulesList,
        //     boxNodeClassList,
        //     node: queryBox.getNode().getText(),
        //     nodeKind: queryBox.getNode().getKindName(),
        // });

        if (mode === "grouped") {
            if (rules.size === 0) {
                return;
            }

            // style fn
            if (!selector) {
                const merged = deepMerge(rulesList.map((conf) => conf.rule));
                const debugId = getDebugIdGrouped({ name, type, count: allRules.size }, rulesList as any);
                const grouped = styleFn<GroupedLocalCssBox>({
                    name,
                    mode: "grouped",
                    type: "local",
                    rule: merged,
                    debugId,
                    fromRules: rulesList,
                });
                logger.scoped("style", { name, grouped });

                if (grouped) {
                    toReplace.set(queryBox.getNode(), grouped);
                }

                return;
            }

            // globalStyle fn
            const cssBoxListBySelector = new Map<string, CssBox[]>();
            const noSelectorKey = "__no_selector__";
            const groupedRuleBySelector: Record<string, StyleRule> = {};
            const groupedRule: StyleRule = {};

            rulesList.forEach((conf) => {
                const rule = conf.rule;
                const selectors = (rule as StyleRule).selectors;

                if (selectors) {
                    const key = Object.keys(selectors)[0];
                    if (key) {
                        if (!groupedRuleBySelector[key]) {
                            groupedRuleBySelector[key] = {};
                        }

                        Object.assign(groupedRuleBySelector[key]!, selectors[key]);

                        if (!cssBoxListBySelector.has(key)) {
                            cssBoxListBySelector.set(key, []);
                        }

                        cssBoxListBySelector.get(key)!.push(conf);
                    }
                } else {
                    Object.assign(groupedRule, rule);

                    if (!cssBoxListBySelector.has(noSelectorKey)) {
                        cssBoxListBySelector.set(noSelectorKey, []);
                    }

                    cssBoxListBySelector.get(noSelectorKey)!.push(conf);
                }
            });

            if (Object.keys(groupedRule).length > 0) {
                const fromRules = cssBoxListBySelector.get(noSelectorKey)!;
                const debugId = getDebugIdGrouped({ name, type, count: allRules.size }, fromRules as any);

                styleFn({
                    name,
                    type: "global",
                    mode: "grouped",
                    debugId,
                    rule: groupedRule,
                    fromRules,
                } as GroupedGlobalCssBox);
            }

            Object.entries(groupedRuleBySelector).forEach(([key, rule]) => {
                const fromRules = cssBoxListBySelector.get(key)!;
                const debugId = getDebugIdGrouped({ name, type, count: allRules.size }, fromRules as any);

                styleFn({
                    name,
                    type: "global",
                    mode: "grouped",
                    rule,
                    debugId,
                    selector: key,
                    fromRules,
                } as GroupedGlobalCssBox);
            });

            toRemove.add(queryBox.getNode());

            return;
        }

        if (mode === "atomic" && boxNodeClassList.size > 0) {
            logger.scoped("style", { name, classNameList: boxNodeClassList.size });
            toReplace.set(queryBox.getNode(), Array.from(boxNodeClassList).join(" "));
        }
    });

    return { toReplace, toRemove, classByDebugId, rulesByDebugId, rulesByBoxNode, allRules };
}

export const generateStyleFromExtraction = (
    args: Omit<GenerateRulesArgs, "generateClassName">
): ReturnType<typeof generateRulesFromExtraction> & {
    allRules: Set<CssBox>;
} => {
    const generateClassName = (cssRule: CssBox) => {
        if (cssRule.type === "local") return style(cssRule.rule, cssRule.debugId);

        globalStyle(cssRule.selector, cssRule.rule);
    };

    return generateRulesFromExtraction({
        ...args,
        generateClassName,
        getDebugId: defaultGetDebugId,
        getDebugIdGrouped: defaultGetDebugIdGrouped,
    });
};

type Nullable<T> = T | null | undefined;
// TODO pastable
export const isNotNullish = <T>(element: Nullable<T>): element is T => element != null;

type GetDebugIdArgs = Pick<CssBox, "name" | "type"> &
    Pick<AtomicLocalCssBox, "propName" | "conditionPath" | "token"> & { count: number };
function defaultGetDebugId({ name, type, count, propName, conditionPath, token }: GetDebugIdArgs) {
    const conditionPathString = conditionPath && conditionPath.length > 0 ? conditionPath.join("_") + "_" : "";
    const typeStr = type === "local" ? "" : `_${count}_global`;
    return `${name}${typeStr}_${propName}_${conditionPathString}${String(token)}`;
}

type GetDebugIdGroupedArgs = Pick<GetDebugIdArgs, "name" | "type" | "count">;
function defaultGetDebugIdGrouped({ name, type, count }: GetDebugIdGroupedArgs, list: GetDebugIdArgs[]) {
    const typeStr = type === "local" ? "" : `_${count}_global`;

    return (
        name +
        typeStr +
        list.reduce((acc, { propName, token, conditionPath }) => {
            const conditionPathString = conditionPath && conditionPath.length > 0 ? conditionPath.join("_") + "_" : "";

            return acc + `__${propName}_${conditionPathString}${String(token)}`;
        }, "")
    );
}
