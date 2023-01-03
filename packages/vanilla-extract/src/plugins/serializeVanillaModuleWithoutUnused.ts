import type { PrimitiveType } from "@box-extractor/core";
import type { AdapterContext } from "@vanilla-extract/integration";
import { hash } from "@vanilla-extract/integration";
import { stringify } from "javascript-stringify";
import { isObject } from "pastable";
import type { UsedComponentMap } from "./getUsedPropertiesFromExtractNodeMap";

import { getCompiledSprinklePropertyByDebugIdPairMap, isCompiledSprinkle } from "./onEvaluated";

type UsedValuesMap = Map<
    string,
    {
        properties: Set<PrimitiveType>;
        conditionalProperties: Map<string, Set<PrimitiveType>>;
        allProperties: Set<PrimitiveType>;
    }
>;

export function serializeVanillaModuleWithoutUnused(
    cssImports: string[],
    exports: Record<string, unknown>,
    context: AdapterContext,
    usedComponentsMap: UsedComponentMap,
    compiled: ReturnType<typeof getCompiledSprinklePropertyByDebugIdPairMap>
) {
    // console.log("serializeVanillaModuleWithoutUnused", usedComponentsMap);
    const unusedCompositions = context.composedClassLists
        .filter(({ identifier }) => !context.usedCompositions.has(identifier))
        .map(({ identifier }) => identifier);

    const unusedCompositionRegex =
        unusedCompositions.length > 0 ? RegExp(`(${unusedCompositions.join("|")})\\s`, "g") : null;

    const recipeImports = new Set<string>();
    const usedValuesMap = mergeUsedValues(usedComponentsMap, compiled);

    const moduleExports = Object.keys(exports).map((key) => {
        const result = stringifyExports(recipeImports, exports[key], unusedCompositionRegex, usedValuesMap);
        return key === "default" ? `export default ${result};` : `export var ${key} = ${result};`;
    });

    const outputCode = [...cssImports, ...Array.from(recipeImports), ...moduleExports];

    // console.dir({ usedValuesMap, outputCode }, { depth: null });
    return outputCode.join("\n");
}

function mergeUsedValues(
    usedMap: UsedComponentMap,
    compiled: ReturnType<typeof getCompiledSprinklePropertyByDebugIdPairMap>
) {
    const mergedMap: UsedValuesMap = new Map();
    const shorthandsMap = new Map(...Array.from(compiled.sprinkleConfigs.values()).map((info) => info.shorthands));

    usedMap.forEach((style, _componentName) => {
        style.properties.forEach((values, propNameOrShorthand) => {
            const registerPropName = (propName: string) => {
                if (!mergedMap.has(propName)) {
                    mergedMap.set(propName, {
                        properties: new Set(values),
                        conditionalProperties: new Map(),
                        allProperties: new Set(values),
                    });
                    return;
                }

                const currentPropValues = mergedMap.get(propName)!.properties;
                const allPropValues = mergedMap.get(propName)!.allProperties;
                values.forEach((value) => {
                    currentPropValues.add(value);
                    allPropValues.add(value);
                });
            };

            registerPropName(propNameOrShorthand);
            if (shorthandsMap.has(propNameOrShorthand)) {
                (shorthandsMap.get(propNameOrShorthand) ?? []).forEach(registerPropName);
                registerPropName(propNameOrShorthand);
            }
        });

        style.conditionalProperties.forEach((properties, conditionalPropOrShorthand) => {
            const registerConditionalPropName = (propNameOrShorthand: string) => {
                const isReversedConditionProp = propNameOrShorthand[0] === "_" && propNameOrShorthand[1] !== "_";
                if (!isReversedConditionProp) {
                    if (!mergedMap.has(propNameOrShorthand)) {
                        mergedMap.set(propNameOrShorthand, {
                            properties: new Set(),
                            conditionalProperties: new Map(properties),
                            allProperties: new Set(Array.from(properties.values()).flatMap((set) => Array.from(set))),
                        });
                        return;
                    }

                    const currentConditionalValues = mergedMap.get(propNameOrShorthand)!.conditionalProperties;
                    const allPropValues = mergedMap.get(propNameOrShorthand)!.allProperties;

                    properties.forEach((values, conditionName) => {
                        if (!currentConditionalValues.has(conditionName)) {
                            currentConditionalValues.set(conditionName, new Set(values));
                            values.forEach((value) => allPropValues.add(value));
                            return;
                        }

                        const currentConditionValues = currentConditionalValues.get(conditionName)!;
                        values.forEach((value) => {
                            currentConditionValues.add(value);
                            allPropValues.add(value);
                        });
                    });

                    return;
                }

                const conditionName = propNameOrShorthand.slice(1);
                // console.log({ propName, propNameOrShorthand, properties });
                properties.forEach((values, propName) => {
                    if (!mergedMap.has(propName)) {
                        mergedMap.set(propName, {
                            properties: new Set(),
                            conditionalProperties: new Map([[conditionName, new Set(values)]]),
                            allProperties: new Set(values),
                        });
                        return;
                    }

                    const currentConditionalValues = mergedMap.get(propName)!.conditionalProperties;
                    const allPropValues = mergedMap.get(propName)!.allProperties;

                    if (!currentConditionalValues.has(conditionName)) {
                        currentConditionalValues.set(conditionName, new Set(values));
                        values.forEach((value) => allPropValues.add(value));
                        return;
                    }

                    const currentConditionValues = currentConditionalValues.get(conditionName)!;
                    values.forEach((value) => {
                        currentConditionValues.add(value);
                        allPropValues.add(value);
                    });
                });
            };

            registerConditionalPropName(conditionalPropOrShorthand);
            if (shorthandsMap.has(conditionalPropOrShorthand)) {
                (shorthandsMap.get(conditionalPropOrShorthand) ?? []).forEach(registerConditionalPropName);
            }
        });
    });

    // console.dir(mergedMap, { depth: null });

    return mergedMap;
}

function stringifyExports(
    recipeImports: Set<string>,
    value: any,
    unusedCompositionRegex: RegExp | null,
    usedValuesMap: UsedValuesMap
): string {
    return stringify(
        value,
        (value, _indent, next) => {
            const valueType = typeof value;

            if (isCompiledSprinkle(value)) {
                // console.log({ sprinkle: value });

                let isUsingAnyCondition = false;
                const usedStyles = Object.fromEntries(
                    Object.entries(value.styles)
                        .filter(([propName]) => usedValuesMap.has(propName))
                        .map(([propName]) => {
                            const propUsedValues = usedValuesMap.get(propName)!;

                            if (propUsedValues.conditionalProperties.size > 0) {
                                isUsingAnyCondition = true;
                            }

                            return [
                                propName,
                                {
                                    ...value.styles[propName],
                                    values: Object.fromEntries(
                                        Object.entries(value.styles[propName]?.values ?? {})
                                            .filter(([valueName]) => propUsedValues.allProperties.has(valueName))
                                            .map(([valueName, propValueMap]) => {
                                                const updated = {
                                                    defaultClass: propValueMap.defaultClass,
                                                } as typeof propValueMap;

                                                const conditions = propValueMap.conditions;
                                                if (conditions && propUsedValues.conditionalProperties.size > 0) {
                                                    const usedConditionsValues = Object.entries(conditions).filter(
                                                        function ([conditionName]) {
                                                            const isPropUsedInDefaultCondition =
                                                                (propUsedValues.properties.has(valueName) &&
                                                                    propValueMap.defaultClass ===
                                                                        conditions[conditionName]) ??
                                                                false;

                                                            const isPropUsedByCondition =
                                                                propUsedValues.conditionalProperties.has(
                                                                    conditionName
                                                                ) &&
                                                                propUsedValues.conditionalProperties
                                                                    .get(conditionName)!
                                                                    .has(valueName);

                                                            return (
                                                                isPropUsedInDefaultCondition || isPropUsedByCondition
                                                            );
                                                        }
                                                    );

                                                    if (usedConditionsValues.length > 0) {
                                                        updated.conditions = Object.fromEntries(usedConditionsValues);
                                                    }
                                                }

                                                return [valueName, updated];
                                            })
                                    ),
                                },
                            ];
                        })
                );

                if (!isUsingAnyCondition) {
                    // value.conditions = undefined;
                }

                // console.dir({ usedStyles, value });

                return next({ ...value, styles: usedStyles });
            }

            if (
                valueType === "boolean" ||
                valueType === "number" ||
                valueType === "undefined" ||
                value === null ||
                Array.isArray(value) ||
                isObject(value)
            ) {
                return next(value);
            }

            if (Symbol.toStringTag in Object(value)) {
                const { [Symbol.toStringTag]: _tag, ...valueWithoutTag } = value;
                return next(valueWithoutTag);
            }

            if (valueType === "string") {
                // console.log({ value });
                return next(unusedCompositionRegex ? value.replace(unusedCompositionRegex, "") : value);
            }

            if (valueType === "function" && (value.__function_serializer__ || value.__recipe__)) {
                const { importPath, importName, args } = value.__function_serializer__ || value.__recipe__;

                if (typeof importPath !== "string" || typeof importName !== "string" || !Array.isArray(args)) {
                    throw new TypeError("Invalid recipe");
                }

                try {
                    // eslint-disable-next-line sonarjs/no-nested-template-literals
                    const hashedImportName = `_${hash(`${importName}${importPath}`).slice(0, 5)}`;

                    recipeImports.add(`import { ${importName} as ${hashedImportName} } from '${importPath}';`);

                    return `${hashedImportName}(${args
                        .map((arg) => stringifyExports(recipeImports, arg, unusedCompositionRegex, usedValuesMap))
                        .join(",")})`;
                } catch (error) {
                    console.error(error);

                    throw new Error("Invalid recipe.");
                }
            }

            throw new Error(`
          Invalid exports.

          You can only export plain objects, arrays, strings, numbers and null/undefined.
        `);
        },
        0,
        {
            references: true, // Allow circular references
            maxDepth: Number.POSITIVE_INFINITY,
            maxValues: Number.POSITIVE_INFINITY,
        }
    )!;
}
