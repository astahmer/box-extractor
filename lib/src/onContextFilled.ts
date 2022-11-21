import type { AdapterContext } from "@vanilla-extract/integration";
import type { SprinklesProperties } from "@vanilla-extract/sprinkles";
import evalCode from "eval";
import { stringify } from "javascript-stringify";
import { isDefined, isObject } from "pastable";
import type { UsedMap } from "./extract";

type Conditions = {
    conditions:
        | undefined
        | {
              defaultCondition: string | false;
              conditionNames: string[];
              responsiveArray?: string[];
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

export function onContextFilled(context: AdapterContext, evalResult: Record<string, unknown>, usedMap: UsedMap) {
    const stringifiedEval = "module.exports = " + stringifyExportsToSprinklesMap(evalResult);
    // console.log(stringifiedEval);
    console.log("bbb");

    const sprinklesMap = evalCode(stringifiedEval) as Record<string, unknown>;
    const flatSprinkles = Object.values(sprinklesMap)
        .flat()
        .filter((value) => isObject(value) && "conditions" in value && "styles" in value) as Array<
        SprinklesProperties & Conditions
    >;

    flatSprinkles.forEach((sprinkle) => {
        let defaultConditionName: string | undefined;
        if ("conditions" in sprinkle && isDefined(sprinkle.conditions) && sprinkle.conditions.defaultCondition) {
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
    // console.log(identifierByDebugId);
    const usedProps = usedMap.get("ColorBox")!.properties;
    console.log(usedProps);
    const usedGeneratedClassNameList = new Set<string>();
    usedProps.forEach((values, propName) => {
        values.forEach((value) => {
            const debugId = `${propName}_${value}`;
            // const className = getClassNameByDebugId(debugId);
            const className = debugIdByPropWithValuePair.get(debugId)?.defaultClass;
            // console.log({ debugId, className });
            if (className) {
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
}

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
            references: true, // Allow circular references
            maxDepth: Number.POSITIVE_INFINITY,
            maxValues: Number.POSITIVE_INFINITY,
        }
    );
}
