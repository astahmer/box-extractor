import evalCode from "eval";
import { stringify } from "javascript-stringify";
import { isObject } from "pastable";

export const getSprinklesMap = (exports: Record<string, unknown>) => {
    const stringifiedEval = "module.exports = " + stringifyExportsToSprinklesMap(exports);
    // console.log(stringifiedEval);
    return evalCode(stringifiedEval) as Record<string, unknown>;
};

function stringifyExportsToSprinklesMap(value: any): any {
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
                return next(value);
            }

            // createSprinkles
            if (valueType === "function" && (value.__function_serializer__ || value.__recipe__)) {
                const { importPath, importName, args } = value.__function_serializer__ || value.__recipe__;

                if (typeof importPath !== "string" || typeof importName !== "string" || !Array.isArray(args)) {
                    throw new TypeError("Invalid recipe");
                }

                try {
                    return "[" + args.map((arg) => stringifyExportsToSprinklesMap(arg)).join(",") + "]";
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
        2,
        {
            references: true,
            maxDepth: Number.POSITIVE_INFINITY,
            maxValues: Number.POSITIVE_INFINITY,
        }
    );
}
