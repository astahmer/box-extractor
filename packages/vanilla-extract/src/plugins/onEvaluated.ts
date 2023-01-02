import type { PrimitiveType } from "@box-extractor/core";
import type { AdapterContext } from "@vanilla-extract/integration";
import { castAsArray, isDefined, isObject } from "pastable";
import type { UsedComponentMap } from "../getUsedPropertiesFromExtractNodeMap";

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
    values?: Record<string, CompiledSprinklePropertyValue>;
    mappings?: string[];
};

type CompiledSprinklePropertyValue = {
    conditions?: Record<string, string>;
    defaultClass: string;
};

export function getUsedClassNameFromCompiledSprinkles(
    compiled: ReturnType<typeof getCompiledSprinklePropertyByDebugIdPairMap>,
    usedMap: UsedComponentMap
) {
    // console.log("getUsedClassNameFromCompiledSprinkles", { context, evalResult, usedMap });

    // console.dir(Array.from(context.cssByFileScope.values()), { depth: null });
    // console.log(compiledSprinkleByDebugId);
    // console.log(identifierByDebugId);
    const compiledMap = compiled.compiledSprinkleByDebugId;
    const shorthandsMap = new Map(...Array.from(compiled.sprinkleConfigs.values()).map((info) => info.shorthands));
    // console.dir({ shorthandsMap }, { depth: null });

    const usedClassNameList = new Set<string>();

    Array.from(usedMap.entries()).forEach(([_componentName, usedStyles]) => {
        // console.log(componentName, usedStyles);
        // console.dir({ usedMap }, { depth: null });

        usedStyles.properties.forEach((values, propNameOrShorthand) => {
            values.forEach((value) => {
                const propName = shorthandsMap.has(propNameOrShorthand)
                    ? shorthandsMap.get(propNameOrShorthand)!.at(0)!
                    : propNameOrShorthand;
                const debugId = getDebugId(propName, value);
                const className = compiledMap.get(debugId)?.defaultClass;
                // console.log({ propNameOrShorthand, propName, value, debugId, className });
                if (className) {
                    usedClassNameList.add(className);
                }
            });
        });

        usedStyles.conditionalProperties.forEach((properties, propNameOrShorthand) => {
            const isReversedConditionProp = propNameOrShorthand[0] === "_" && propNameOrShorthand[1] !== "_";
            properties.forEach((values, condNameOrPropName) => {
                const conditionName = isReversedConditionProp ? propNameOrShorthand.slice(1) : condNameOrPropName;

                values.forEach((value) => {
                    const propName = shorthandsMap.has(propNameOrShorthand)
                        ? shorthandsMap.get(propNameOrShorthand)!.at(0)!
                        : isReversedConditionProp
                        ? condNameOrPropName
                        : propNameOrShorthand;
                    const debugId = getDebugId(propName, value);
                    const propValue = compiledMap.get(debugId);
                    const className = propValue?.conditions?.[conditionName];
                    if (className) {
                        usedClassNameList.add(className);
                    }
                });
            });
        });
    });

    // console.log({ usedClassNameList });

    return usedClassNameList;
}

type InferMapValue<T> = T extends Map<any, infer V> ? V : never;
type CssRuleList = InferMapValue<AdapterContext["cssByFileScope"]>;

export const mutateContextByKeepingUsedRulesOnly = ({
    context,
    usedClassNameList,
    sprinklesClassNames,
    onMutate,
}: {
    context: AdapterContext;
    usedClassNameList: Set<string>;
    sprinklesClassNames: ReturnType<typeof getCompiledSprinklePropertyByDebugIdPairMap>["sprinklesClassNames"];
    onMutate?: (args: { fileScope: string; before: CssRuleList; after: CssRuleList }) => void;
}) => {
    context.cssByFileScope.forEach((css, fileScope) => {
        // const fileName = getFileNameFromFileScopeStr(fileScope);
        const usedRules = css.filter((rule) => {
            if (rule.type !== "local") return true;

            const isClassNameUsed = usedClassNameList.has(rule.selector);
            const isSprinklesClassName = sprinklesClassNames.has(rule.selector);
            const isSelectorUsed = isClassNameUsed || !isSprinklesClassName;

            if (!isSelectorUsed) {
                context.localClassNames.delete(rule.selector);
            }

            return isSelectorUsed;
        });

        if (css.length !== usedRules.length) {
            context.cssByFileScope.set(fileScope, usedRules);
            onMutate?.({ fileScope, before: css, after: usedRules });
        }
    });

    // console.dir(Array.from(context.cssByFileScope.values()), { depth: null });
};

export const cloneAdapterContext = (context: AdapterContext): AdapterContext => {
    return {
        cssByFileScope: new Map(context.cssByFileScope),
        localClassNames: new Set(context.localClassNames),
        composedClassLists: context.composedClassLists.slice(),
        usedCompositions: new Set(context.usedCompositions),
    };
};

const getDebugId = (propName: string, value: PrimitiveType) => `${propName}_${value}`;

type CompiledSprinkleInfo = {
    properties: Set<string>;
    shorthands: Map<string, string[]>;
} & Conditions;

export function getCompiledSprinklePropertyByDebugIdPairMap(evalResult: Record<string, unknown>) {
    const compiledSprinkleByDebugId = new Map<
        string,
        CompiledSprinklePropertyValue & { defaultConditionName: string | undefined }
    >();
    const sprinklesClassNames = new Set<string>();
    const sprinkleConfigs = new Map<string, CompiledSprinkleInfo>();

    const evaluated = getSprinklesMap(evalResult) as Record<string, CompiledSprinkle[]>;
    const flatSprinkles = Object.entries(evaluated).flatMap(([sprinkleName, sprinkle]) => {
        return castAsArray(sprinkle)
            .filter(isCompiledSprinkle)
            .map((s) => ({ ...s, name: sprinkleName }));
    });

    flatSprinkles.forEach((sprinkle) => {
        let defaultConditionName: string | undefined;
        if (isDefined(sprinkle.conditions) && sprinkle.conditions.defaultCondition) {
            defaultConditionName = sprinkle.conditions.defaultCondition;
        }

        const properties = new Set<string>();
        const shorthands = new Map<string, string[]>();
        sprinkleConfigs.set(sprinkle.name, { properties, conditions: sprinkle.conditions, shorthands });

        Object.entries(sprinkle.styles).forEach(([propNameOrShorthand, compiledSprinkle]) => {
            properties.add(propNameOrShorthand);

            if ("values" in compiledSprinkle) {
                Object.entries(compiledSprinkle.values).forEach(([valueName, value]) => {
                    sprinklesClassNames.add(value.defaultClass);

                    if (value.conditions) {
                        Object.entries(value.conditions).forEach(([_conditionName, className]) => {
                            sprinklesClassNames.add(className);
                        });
                    }

                    compiledSprinkleByDebugId.set(getDebugId(propNameOrShorthand, valueName), {
                        ...value,
                        defaultConditionName,
                    });
                });
            }

            if ("mappings" in compiledSprinkle) {
                shorthands.set(propNameOrShorthand, compiledSprinkle.mappings);
                // console.log({ propNameOrShorthand, mappings: compiledSprinkle.mappings });

                // loop on each shorthands's property and do as above: add each prop values/conditions used
                compiledSprinkle.mappings.forEach((propName) => {
                    const property = sprinkle.styles[propName];
                    // console.log({ propNameOrShorthand, property, propName });
                    if (!property) return;
                    if (!("values" in property)) return;

                    if (property.values) {
                        Object.entries(property.values).forEach(([valueName, value]) => {
                            sprinklesClassNames.add(value.defaultClass);

                            if (value.conditions) {
                                Object.entries(value.conditions).forEach(([_conditionName, className]) => {
                                    sprinklesClassNames.add(className);
                                });
                            }

                            // pt_0
                            compiledSprinkleByDebugId.set(getDebugId(propNameOrShorthand, valueName), {
                                ...value,
                                defaultConditionName,
                            });
                            // paddingTop_0
                            compiledSprinkleByDebugId.set(getDebugId(propName, valueName), {
                                ...value,
                                defaultConditionName,
                            });
                        });
                    }
                });
            }
        });
    });

    return {
        compiledSprinkleByDebugId,
        sprinklesClassNames,
        evaluated,
        sprinkleConfigs,
    };
}
