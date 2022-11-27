import type { AdapterContext } from "@vanilla-extract/integration";
import { isDefined, isObject } from "pastable";

import type { UsedComponentsMap } from "./extractor/types";
import { getSprinklesMap } from "./getSprinklesMap";

type Conditions = {
    conditions:
        | undefined
        | {
              defaultCondition: string | false;
              conditionNames: string[];
              responsiveArray?: string[];
          };
};

type CompiledSprinkle = { styles: Record<string, CompiledSprinklePropertyMap> } & Conditions;
export const isCompiledSprinkle = (value: any): value is CompiledSprinkle => {
    return isObject(value) && "styles" in value && "conditions" in value;
};

type CompiledSprinklePropertyMap = {
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

export function onContextFilled(
    context: AdapterContext,
    evalResult: Record<string, unknown>,
    usedMap: UsedComponentsMap
) {
    const sprinklesMap = getSprinklesMap(evalResult);
    // console.log(sprinklesMap);
    const flatSprinkles = Object.values(sprinklesMap).flat().filter(isCompiledSprinkle);

    flatSprinkles.forEach((sprinkle) => {
        let defaultConditionName: string | undefined;
        if (isDefined(sprinkle.conditions) && sprinkle.conditions.defaultCondition) {
            defaultConditionName = sprinkle.conditions.defaultCondition;
        }

        Object.entries(sprinkle.styles).forEach(([propName, compiledSprinkle]) => {
            if ("values" in compiledSprinkle) {
                Object.entries(compiledSprinkle.values).forEach(([valueName, value]) => {
                    // console.log({ value, propName, valueName });
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
    Array.from(usedMap.entries()).forEach(([componentName, usedStyles]) => {
        console.log(componentName, usedStyles);
        const usedGeneratedClassNameList = new Set<string>();

        usedStyles.properties.forEach((values, propName) => {
            values.forEach((value) => {
                const debugId = `${propName}_${value}`;
                const className = debugIdByPropWithValuePair.get(debugId)?.defaultClass;
                // console.log({ debugId, className });
                if (className) {
                    usedGeneratedClassNameList.add(className);
                }
            });
        });

        usedStyles.conditionalProperties.forEach((properties, propName) => {
            properties.forEach((values, conditionName) => {
                values.forEach((value) => {
                    const debugId = `${propName}_${value}`;
                    const className = debugIdByPropWithValuePair.get(debugId)?.conditions?.[conditionName];
                    // console.log({ debugId, className, conditionName });
                    if (className) {
                        usedGeneratedClassNameList.add(className);
                    }
                });
            });
        });

        context.cssByFileScope.forEach((css, fileScope) => {
            // const fileName = getFileNameFromFileScopeStr(fileScope);
            const usedRules = css.filter((rule) => {
                if (rule.type !== "local") return true;

                const isSelectorUsed = usedGeneratedClassNameList.has(rule.selector);

                if (!isSelectorUsed) {
                    context.localClassNames.delete(rule.selector);
                }

                return isSelectorUsed;
            });

            context.cssByFileScope.set(fileScope, usedRules);
            console.log({ from: css.length, to: usedRules.length });
        });
        // console.dir(Array.from(context.cssByFileScope.values()), { depth: null });
        console.log({ usedGeneratedClassNameList });
    });
}
