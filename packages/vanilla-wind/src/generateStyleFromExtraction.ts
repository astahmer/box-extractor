import { box, BoxNode, isPrimitiveType, LiteralValue, PropNodesMap } from "@box-extractor/core";
import { createLogger } from "@box-extractor/logger";
import { style, StyleRule } from "@vanilla-extract/css";
import { deepMerge } from "pastable";
import { Node } from "ts-morph";
import type { GenericConfig } from "./defineProperties";

const logger = createLogger("box-ex:vanilla-wind:generateStyleFromExtraction");

export function generateStyleFromExtraction(
    name: string,
    extracted: PropNodesMap,
    config: GenericConfig,
    mode: "atomic" | "grouped" = "atomic"
): {
    toReplace: Map<Node, string>;
    classMap: Map<string, string>;
} {
    const toReplace = new Map<Node, string>();
    const classMap = new Map<string, string>();
    const rules = new Map<string, StyleRule>();

    const shorthandNames = new Set(Object.keys(config.shorthands ?? {}));
    const conditionNames = new Set(Object.keys(config.conditions ?? {}));
    const propertyNames = new Set(Object.keys(config.properties ?? {}));

    logger({ name, mode });

    extracted.queryList.forEach((query) => {
        const classNameList = new Set<string>();

        const argMap = new Map<string, BoxNode[]>();
        shorthandNames.forEach((shorthand) => {
            if (!query.box.value.has(shorthand)) return;
            config.shorthands![shorthand]!.forEach((prop) => argMap.set(prop, query.box.value.get(shorthand)!));
        });
        for (const [arg, nodeList] of query.box.value.entries()) {
            if (shorthandNames.has(arg)) continue;
            argMap.set(arg, nodeList);
        }

        argMap.forEach((nodeList, argName) => {
            const processValue = (boxNode: BoxNode, path: string[] = []) => {
                // console.log({ name, argName, path });

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
                        // use token value if defined / allow any CSS value if not
                        const propValues = config.properties?.[argName as keyof typeof config.properties];
                        const value =
                            propValues === true
                                ? primitive
                                : propValues?.[primitive as keyof typeof propValues] ?? primitive;

                        const debugId = `${name}_${argName}_${String(primitive)}`;
                        const rule = { [argName]: value } as StyleRule;

                        if (mode === "atomic") {
                            const className = classMap.get(debugId) ?? style(rule, debugId);
                            classMap.set(debugId, className);
                            classNameList.add(className);
                        }

                        rules.set(debugId, rule);

                        logger.scoped("style", { literal: true, debugId });
                        return;
                    }

                    const propNames = [];
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
                            const className = classMap.get(debugId) ?? style(rule, debugId);
                            classMap.set(debugId, className);
                            classNameList.add(className);
                        }

                        rules.set(debugId, rule);

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
                            // const className = style({ [argName]: { [path.join("-")]: { [propName]: literal } } }, debugId);
                            // classMap.set(debugId, className);
                            // classNameList.add(className);
                            // console.log({ name, argName, literal, nestedPath });
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
                        toReplace.set(node, "");
                        return;
                    }

                    const jsxAttribute = box.getStack()[0];
                    if (Node.isJsxAttribute(jsxAttribute)) {
                        toReplace.set(jsxAttribute, "");
                    }
                }
            });
        });

        if (mode === "grouped") {
            const merged = deepMerge(Array.from(rules.values()));
            const grouped = style(merged);
            logger.scoped("style", { name, grouped });

            toReplace.set(query.box.getNode(), grouped);
            classMap.set(grouped, grouped);
            return;
        }

        if (mode === "atomic" && classNameList.size > 0) {
            logger.scoped("style", { name, classNameList: classNameList.size });
            toReplace.set(query.box.getNode(), Array.from(classNameList).join(" "));
        }
    });

    return { toReplace, classMap };
}

type Nullable<T> = T | null | undefined;

export const isNotNullish = <T>(element: Nullable<T>): element is T => element != null;
