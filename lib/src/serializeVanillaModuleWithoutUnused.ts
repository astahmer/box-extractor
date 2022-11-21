import type { AdapterContext } from "@vanilla-extract/integration";
import { hash } from "@vanilla-extract/integration";
import { stringify } from "javascript-stringify";
import { isObject } from "pastable";
import type { UsedMap } from "./extract";
import { isCompiledSprinkle } from "./onContextFilled";

export function serializeVanillaModuleWithoutUnused(
    cssImports: string[],
    exports: Record<string, unknown>,
    context: AdapterContext,
    usedMap: UsedMap
) {
    // console.log("serializeVanillaModuleWithoutUnused", usedMap);
    const unusedCompositions = context.composedClassLists
        .filter(({ identifier }) => !context.usedCompositions.has(identifier))
        .map(({ identifier }) => identifier);

    const unusedCompositionRegex =
        unusedCompositions.length > 0 ? RegExp(`(${unusedCompositions.join("|")})\\s`, "g") : null;

    const recipeImports = new Set<string>();

    const moduleExports = Object.keys(exports).map((key) => {
        const result = stringifyExports(recipeImports, exports[key], unusedCompositionRegex, usedMap);
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
    usedMap: UsedMap
): any {
    const usedProps = usedMap.get("ColorBox")!.properties;
    const usedPropNames = new Set(usedProps.keys());

    return stringify(
        value,
        (value, _indent, next) => {
            const valueType = typeof value;

            if (isCompiledSprinkle(value)) {
                // console.log({ sprinkle: value });

                // TODO rm les conditions unused aussi en passant
                // conditions: { defaultCondition: xxx, conditionNames: xxx, responsiveArray: xxx }
                // -> conditions: { defaultCondition: xxx, conditionNames: xxx.filter(isUsed), responsiveArray: xxx.filter(isUsed) }
                // ou complètement -> conditions: undefined
                // console.log({ value });
                const usedStyles = Object.fromEntries(
                    Object.entries(value.styles)
                        .filter(([propName]) => usedPropNames.has(propName))
                        .map(([propName]) => {
                            const propUsedValues = usedProps.get(propName)!;
                            // const usedValues = Object.keys(value.styles[propName].values).filter((valueName) => !propValues.has(valueName));
                            // console.log(propUsedValues, value.styles[propName]);

                            return [
                                propName,
                                {
                                    ...value.styles[propName],
                                    values: Object.fromEntries(
                                        Object.entries(value.styles[propName]!.values).filter(([valueName]) =>
                                            propUsedValues.has(valueName)
                                        )
                                    ),
                                },
                            ];
                        })
                );
                // console.dir({ usedStyles });

                return next(usedStyles);
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
                        .map((arg) => stringifyExports(recipeImports, arg, unusedCompositionRegex, usedMap))
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
    );
}
