import presetIcons from "@unocss/preset-icons";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { parseFileScope } from "@vanilla-extract/integration";
import { generateDebugIdentifier, prefixWithUnderscoreIfNumericStart } from "@vanilla-extract/css";
import react from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";
import { stringify } from "javascript-stringify";
import evalCode from "eval";

import { createViteBoxExtractor, UsedMap } from "vite-box-extractor";
import { isDefined, isObject } from "pastable";
import type { SprinklesProperties } from "@vanilla-extract/sprinkles/dist/declarations/src/types";

const usedMap = new Map() as UsedMap;
// const identifierByDebugId = new Map<
//     string,
//     { scope: string; index: number; debugId: string; className: string; fileName: string }
// >();
// const getClassNameByDebugId = (debugId: string) => identifierByDebugId.get(debugId)?.className;

const getFileNameFromFileScopeStr = (scopeStr: string) => {
    const fileScope = parseFileScope(scopeStr);
    return fileScope.filePath.split("/").pop()?.replace(".css.ts", "");
};

type Conditions = {
    conditions:
        | undefined
        | {
              defaultCondition: string | false;
              conditionNames: Array<string>;
              responsiveArray?: Array<string>;
          };
};

type CompiledSprinkle = {
    values: Record<string, CompiledSprinklePropertyValue>;
};

type CompiledSprinklePropertyValue = {
    conditions?: Record<string, string>;
    defaultClass: string;
};

const debugIdByPropWithValuePair = new Map<
    string,
    CompiledSprinklePropertyValue & { defaultConditionName: string | undefined }
>();

// https://vitejs.dev/config/
export default defineConfig((env) => ({
    base: "/",
    root: "./",
    build: { outDir: "./dist", sourcemap: true },
    plugins: [
        createViteBoxExtractor({ config: { ColorBox: ["color", "backgroundColor"] }, used: usedMap }),
        UnoCSS({ presets: [presetIcons({})] }),
        react(),
        vanillaExtractPlugin({
            // identifiers: "short",
            identifiers: (scope, index, debugId) => {
                const className = prefixWithUnderscoreIfNumericStart(generateDebugIdentifier(scope, index, debugId));

                // no debugId means it's a global selector className (ex: from createTheme)
                // or a className generated from `style({ prop: value })`
                // here we only care about the className generated from the `style(prop, debugId)` calls used internally by `createSprinkles`
                if (debugId) {
                    // const fileName = getFileNameFromFileScopeStr(scope)!;
                    // identifierByDebugId.set(debugId, { scope, index, debugId, className, fileName });
                    // console.log({ scope, index, debugId, className, fileName });
                }

                return className;
            },
            // TODO try with multiple .css.ts files
            onContextFilled: (context, evalResult) => {
                const stringifiedEval = "module.exports = " + stringifyExports(evalResult);
                // console.log(stringifiedEval);

                const sprinklesMap = evalCode(stringifiedEval) as Record<string, unknown>;
                const flatSprinkles = Object.values(sprinklesMap)
                    .flat()
                    .filter((value) => isObject(value) && "conditions" in value && "styles" in value) as Array<
                    SprinklesProperties & Conditions
                >;

                flatSprinkles.forEach((sprinkle) => {
                    let defaultConditionName: string | undefined;
                    if (
                        "conditions" in sprinkle &&
                        isDefined(sprinkle.conditions) &&
                        sprinkle.conditions.defaultCondition
                    ) {
                        defaultConditionName = sprinkle.conditions.defaultCondition;
                    }

                    Object.entries(sprinkle.styles).forEach(([propName, prop]) => {
                        if ("values" in prop) {
                            const compiledSprinkle = prop as CompiledSprinkle;
                            Object.entries(compiledSprinkle.values).forEach(([valueName, value]) => {
                                debugIdByPropWithValuePair.set(`${propName}_${valueName}`, {
                                    ...value,
                                    defaultConditionName,
                                });
                            });
                        }
                    });
                });

                // console.dir(Array.from(context.cssByFileScope.values()), { depth: null });
                // console.log(debugIdByPropWithValuePair);
                console.log(usedMap);
                // console.log(identifierByDebugId);
                const usedProps = usedMap.get("ColorBox")!.properties;
                const usedGeneratedClassNameList = new Set<string>();
                usedProps.forEach((values, propName) => {
                    values.forEach((value) => {
                        const debugId = `${propName}_${value}`;
                        // const className = getClassNameByDebugId(debugId);
                        const className = debugIdByPropWithValuePair.get(debugId)?.defaultClass;
                        if (className) {
                            // console.log({ debugId, className });
                            usedGeneratedClassNameList.add(className);
                        }
                    });
                });

                context.cssByFileScope.forEach((css, fileScope) => {
                    // const fileName = getFileNameFromFileScopeStr(fileScope);
                    const usedRules = css.slice().filter((rule) => {
                        if (rule.type === "local") {
                            const isRuleUsed = usedGeneratedClassNameList.has(rule.selector);

                            if (!isRuleUsed) {
                                context.localClassNames.delete(rule.selector);
                            }

                            return isRuleUsed;
                        }

                        return true;
                    });

                    context.cssByFileScope.set(fileScope, usedRules);
                    console.log({ from: css.length, to: usedRules.length });
                });
                // console.dir(Array.from(context.cssByFileScope.values()), { depth: null });
                console.log({ usedGeneratedClassNameList: usedGeneratedClassNameList });
            },
        }) as any,
    ],
    resolve: {
        alias: [
            {
                find: "@",
                replacement: "/src",
            },
        ],
    },
}));

function stringifyExports(value: any): any {
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
                    throw new Error("Invalid recipe");
                }

                try {
                    return "[" + args.map((arg) => stringifyExports(arg)).join(",") + "]";
                } catch (err) {
                    console.error(err);

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
            references: true, // Allow circular references
            maxDepth: Infinity,
            maxValues: Infinity,
        }
    );
}
