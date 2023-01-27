import { BoxNode, FunctionNodesMap, isPrimitiveType, LiteralValue } from "@box-extractor/core";
import { style, StyleRule } from "@vanilla-extract/css";
import type { Node } from "ts-morph";
import type { GenericPropsConfig } from "./defineProperties";

// TODO mode = "atomic" | "grouped"
export function generateStyleFromExtraction(name: string, extracted: FunctionNodesMap, config: GenericPropsConfig) {
    const toReplace = new Map<Node, string>();
    const classMap = new Map<string, string>();

    const shorthandNames = new Set(config.shorthands ? Object.keys(config.shorthands) : []);
    const conditionNames = new Set(config.conditions ? Object.keys(config.conditions) : []);
    const propertyNames = new Set(Object.keys(config.properties));

    // console.log({ name, config });

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
            const processValue = (box: BoxNode, path: string[] = []) => {
                // console.log({ name, argName, path });

                if (
                    box.type === "empty-initializer" ||
                    box.type === "unresolvable" ||
                    (box.type === "object" && box.isEmpty)
                ) {
                    return;
                }

                if (box.type === "literal") {
                    const primitive = box.value;
                    if (!isNotNullish(primitive) || typeof primitive === "boolean") return;

                    if (path.length === 0) {
                        // use token value if defined / allow any CSS value if not
                        const propValues = config.properties[argName as keyof typeof config.properties];
                        const value =
                            propValues === true
                                ? primitive
                                : propValues?.[primitive as keyof typeof propValues] ?? primitive;

                        const debugId = `${name}_${argName}_${String(primitive)}`;
                        const className = style({ [argName]: value }, debugId);
                        classMap.set(debugId, className);
                        classNameList.add(className);

                        // TODO logger
                        // console.log({ name, propName, value, className, from: from.getKindName() });
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
                        const propValues = config.properties[propName as keyof typeof config.properties];
                        const value =
                            propValues === true
                                ? primitive
                                : propValues?.[primitive as keyof typeof propValues] ?? primitive;

                        const styleValue: StyleRule = { [propName]: value };
                        const rule: StyleRule = {};
                        const conditionPath = [] as string[];

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
                                selector = [selector, condition.selector].filter(Boolean).join(" ");
                                rule.selectors = {
                                    [selector]: styleValue,
                                };
                            }
                        });

                        const debugId = `${name}_${propName}_${conditionPath.join(".")}_${String(primitive)}`;
                        const className = style(rule, debugId);
                        classMap.set(debugId, className);
                        classNameList.add(className);

                        // TODO logger
                        // console.log({
                        //     name,
                        //     argName,
                        //     path,
                        //     propName,
                        //     boxValue: box.value,
                        //     value,
                        //     styleValue,
                        //     currentCondition: rule,
                        //     selector,
                        //     debugId,
                        //     className,
                        // });
                    });

                    return;
                }

                if (box.type === "map") {
                    box.value.forEach((propNodeList, propName) => {
                        propNodeList.forEach((propNode) => processValue(propNode, [...path, propName]));
                    });
                    return;
                }

                if (box.type === "object") {
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

                    Object.entries(box.value).forEach(([propName, literal]) => {
                        processLiteralValue(literal, [...path, propName]);
                    });

                    return;
                }

                if (box.type === "conditional") {
                    processValue(box.whenTrue, path);
                    processValue(box.whenFalse, path);
                    // console.log({ name, argName, path, box });
                    return;
                }

                if (box.type === "list") {
                    box.value.forEach((listNode) => processValue(listNode, path));
                }
            };

            nodeList.forEach((box) => {
                processValue(box);
            });
        });

        toReplace.set(query.box.fromNode(), Array.from(classNameList).join(" "));
    });

    return { toReplace, classMap };
}

type Nullable<T> = T | null | undefined;

export const isNotNullish = <T>(element: Nullable<T>): element is T => element != null;
