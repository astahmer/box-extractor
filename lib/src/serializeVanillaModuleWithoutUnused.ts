import type { AdapterContext } from "@vanilla-extract/integration";
import { hash } from "@vanilla-extract/integration";
import { stringify } from "javascript-stringify";
import { isObject } from "pastable";
import type { UsedMap } from "./extract";

export function serializeVanillaModuleWithoutUnused(
    cssImports: string[],
    exports: Record<string, unknown>,
    context: AdapterContext,
    usedMap: UsedMap
) {
    console.log(usedMap);
    const unusedCompositions = context.composedClassLists
        .filter(({ identifier }) => !context.usedCompositions.has(identifier))
        .map(({ identifier }) => identifier);

    const unusedCompositionRegex =
        unusedCompositions.length > 0 ? RegExp(`(${unusedCompositions.join("|")})\\s`, "g") : null;

    const recipeImports = new Set<string>();

    const moduleExports = Object.keys(exports).map((key) =>
        key === "default"
            ? `export default ${stringifyExports(recipeImports, exports[key], unusedCompositionRegex)};`
            : `export var ${key} = ${stringifyExports(recipeImports, exports[key], unusedCompositionRegex)};`
    );

    const outputCode = [...cssImports, ...Array.from(recipeImports), ...moduleExports];

    return outputCode.join("\n");
}

function stringifyExports(recipeImports: Set<string>, value: any, unusedCompositionRegex: RegExp | null): any {
    return stringify(
        value,
        (value, _indent, next) => {
            const valueType = typeof value;

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
                        .map((arg) => stringifyExports(recipeImports, arg, unusedCompositionRegex))
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
