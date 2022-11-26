import type { AdapterContext } from "@vanilla-extract/integration";
import { hash } from "@vanilla-extract/integration";
import { stringify } from "javascript-stringify";
import { isObject } from "pastable";

import type { UsedComponentsMap } from "./extractor/types";
import { isCompiledSprinkle } from "./onContextFilled";

type UsedValuesMap = Map<
    string,
    { properties: Set<string>; conditionalProperties: Map<string, Set<string>>; allProperties: Set<string> }
>;

export function serializeVanillaModuleWithoutUnused(
    cssImports: string[],
    exports: Record<string, unknown>,
    context: AdapterContext,
    usedMap: UsedComponentsMap
) {
    // console.log("serializeVanillaModuleWithoutUnused", usedMap);
    const unusedCompositions = context.composedClassLists
        .filter(({ identifier }) => !context.usedCompositions.has(identifier))
        .map(({ identifier }) => identifier);

    const unusedCompositionRegex =
        unusedCompositions.length > 0 ? RegExp(`(${unusedCompositions.join("|")})\\s`, "g") : null;

    const recipeImports = new Set<string>();
    const mergedMap: UsedValuesMap = new Map();

    usedMap.forEach((style, _componentName) => {
        style.properties.forEach((values, propName) => {
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
        });

        style.conditionalProperties.forEach((values, propName) => {
            if (!mergedMap.has(propName)) {
                // TODO
                mergedMap.set(propName, {
                    properties: new Set(),
                    conditionalProperties: new Map(values),
                    allProperties: new Set(Array.from(values.values()).flatMap((set) => Array.from(set))),
                });
                return;
            }

            const currentConditionalValues = mergedMap.get(propName)!.conditionalProperties;
            const allPropValues = mergedMap.get(propName)!.allProperties;

            values.forEach((values, conditionName) => {
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
        });
    });

    const moduleExports = Object.keys(exports).map((key) => {
        const result = stringifyExports(recipeImports, exports[key], unusedCompositionRegex, mergedMap);
        return key === "default" ? `export default ${result};` : `export var ${key} = ${result};`;
    });

    const outputCode = [...cssImports, ...Array.from(recipeImports), ...moduleExports];
    // console.log(outputCode);

    return outputCode.join("\n");
}

function stringifyExports(
    recipeImports: Set<string>,
    value: any,
    unusedCompositionRegex: RegExp | null,
    valuesUsedMap: UsedValuesMap
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
                        .filter(([propName]) => valuesUsedMap.has(propName))
                        .map(([propName]) => {
                            const propUsedValues = valuesUsedMap.get(propName)!;

                            if (propUsedValues.conditionalProperties.size > 0) {
                                isUsingAnyCondition = true;
                            }

                            // const usedValues = Object.keys(value.styles[propName].values).filter((valueName) => !propValues.has(valueName));
                            // console.log(propUsedValues, value.styles[propName]);

                            return [
                                propName,
                                {
                                    ...value.styles[propName],
                                    values: Object.fromEntries(
                                        Object.entries(value.styles[propName]!.values).filter(([valueName]) =>
                                            propUsedValues.allProperties.has(valueName)
                                        )
                                    ),
                                },
                            ];
                        })
                );

                if (!isUsingAnyCondition) {
                    value.conditions = undefined;
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
                        .map((arg) => stringifyExports(recipeImports, arg, unusedCompositionRegex, valuesUsedMap))
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
