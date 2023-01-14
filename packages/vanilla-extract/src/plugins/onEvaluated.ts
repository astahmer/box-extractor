import type { PrimitiveType } from "@box-extractor/core";
import type { ComplexStyleRule } from "@vanilla-extract/css";
import type { AdapterContext } from "@vanilla-extract/integration";
import { castAsArray, isDefined, isObject } from "pastable";
import type { UsedComponentMap } from "./getUsedPropertiesFromExtractNodeMap";

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

// Inlined from https://github.com/astahmer/vanilla-extract/blob/dab0f257c10cdf3aec9a220dbf6191281ada0831/packages/recipes/src/types.ts#L1
// since it's not exported
type RecipeStyleRule = ComplexStyleRule | string;

type VariantDefinitions = Record<string, RecipeStyleRule>;

type BooleanMap<T> = T extends "true" | "false" ? boolean : T;

type VariantGroups = Record<string, VariantDefinitions>;
type VariantSelection<Variants extends VariantGroups> = {
    [VariantGroup in keyof Variants]?: BooleanMap<keyof Variants[VariantGroup]>;
};

export type PatternResult = {
    defaultClassName: string;
    variantClassNames: {
        [P in keyof VariantGroups]: { [P in keyof VariantGroups[keyof VariantGroups]]: string };
    };
    defaultVariants: VariantSelection<VariantGroups>;
    compoundVariants: Array<[VariantSelection<VariantGroups>, string]>;
};
export type RecipePatternResult = { name: string } & Partial<PatternResult>;

// end of inlined code

export type CompiledSprinkle = { styles: Record<string, CompiledSprinklePropertyMap> } & Conditions;
export type CompiledResult = CompiledSprinkle | RecipePatternResult;

export const isCompiledSprinkle = (value: any): value is CompiledSprinkle => {
    return isObject(value) && "styles" in value && "conditions" in value;
};

export const isRecipePatternResult = (value: any): value is RecipePatternResult | PatternResult => {
    return (
        isObject(value) &&
        ("defaultClassName" in value ||
            "variantClassNames" in value ||
            "defaultVariants" in value ||
            "compoundVariants" in value)
    );
};

type CompiledSprinklePropertyMap = {
    values?: Record<string, CompiledSprinklePropertyValue>;
    mappings?: string[];
};

type CompiledSprinklePropertyValue = {
    conditions?: Record<string, string>;
    defaultClass: string;
};

export function getUsedClassNameListFromCompiledResult({
    compiled,
    usedMap,
    usedRecipeDebugIdList,
}: {
    compiled: ReturnType<typeof getEvalCompiledResultByKind>;
    usedMap: UsedComponentMap;
    usedRecipeDebugIdList: Set<string>;
}) {
    const compiledMap = compiled.compiledSprinkleByDebugId;
    const shorthandsMap = new Map(...Array.from(compiled.sprinkleConfigs.values()).map((info) => info.shorthands));
    // console.dir({ shorthandsMap }, { depth: null });

    const usedClassNameList = new Set<string>();
    const usedRecipeClassNameList = new Set<string>();

    Array.from(usedMap.entries()).forEach(([_componentName, usedStyles]) => {
        console.log({ _componentName }, usedStyles);
        // console.dir({ usedMap }, { depth: null });

        usedStyles.properties.forEach((values, propNameOrShorthand) => {
            values.forEach((value) => {
                const propName = shorthandsMap.has(propNameOrShorthand)
                    ? shorthandsMap.get(propNameOrShorthand)!.at(0)!
                    : propNameOrShorthand;
                const debugId = getSprinkleDebugId(propName, value);
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
                    const debugId = getSprinkleDebugId(propName, value);
                    const propValue = compiledMap.get(debugId);
                    const className = propValue?.conditions?.[conditionName];
                    if (className) {
                        usedClassNameList.add(className);
                    }
                });
            });
        });
    });

    usedRecipeDebugIdList.forEach((debugId) => {
        const recipe = compiled.recipesByDebugId.get(debugId);
        if (!recipe) return;
        if (!isRecipePatternResult(recipe)) return;

        if (recipe.defaultClassName) {
            usedClassNameList.add(recipe.defaultClassName);
            usedRecipeClassNameList.add(recipe.defaultClassName);
        }

        if (recipe.variantClassNames) {
            Object.entries(recipe.variantClassNames).forEach(([propName, variantClassNameMap]) => {
                Object.entries(variantClassNameMap).forEach(([propValue, className]) => {
                    const recipeDebugId = `recipe.${recipe.name}.variant.${propName}_${propValue}`;
                    if (recipeDebugId === debugId) {
                        usedClassNameList.add(className);
                        usedRecipeClassNameList.add(className);
                    }
                });
            });
        }

        if (recipe.compoundVariants) {
            recipe.compoundVariants.forEach(([_variantSelection, className], index) => {
                const recipeDebugId = `recipe.${recipe.name}.compound.${index}`;
                if (recipeDebugId === debugId) {
                    usedClassNameList.add(className);
                    usedRecipeClassNameList.add(className);
                }
            });
        }
    });

    return { usedClassNameList, usedRecipeClassNameList };
}

type InferMapValue<T> = T extends Map<any, infer V> ? V : never;
type CssRuleList = InferMapValue<AdapterContext["cssByFileScope"]>;

export const mutateContextByKeepingUsedRulesOnly = ({
    context,
    usedClassNameList,
    compiled,
    onMutate,
}: {
    context: AdapterContext;
    usedClassNameList: Set<string>;
    compiled: ReturnType<typeof getEvalCompiledResultByKind>;
    onMutate?: (args: { fileScope: string; before: CssRuleList; after: CssRuleList }) => void;
}) => {
    const { sprinklesClassNames, recipesClassNames } = compiled;

    context.cssByFileScope.forEach((css, fileScope) => {
        // const fileName = getFileNameFromFileScopeStr(fileScope);
        const usedRules = css.filter((rule) => {
            if (rule.type !== "local") return true;

            const isClassNameUsed = usedClassNameList.has(rule.selector);
            const isSprinklesClassName = sprinklesClassNames.has(rule.selector);
            const isRecipesClassName = recipesClassNames.has(rule.selector);
            const isSelectorUsed = isClassNameUsed || (!isSprinklesClassName && !isRecipesClassName);

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

const getSprinkleDebugId = (propName: string, value: PrimitiveType) => `${propName}_${value}`;
// const getRecipeDebugId = (propName: string, value: PrimitiveType) => `${propName}_${value}`;

type CompiledSprinkleInfo = {
    properties: Set<string>;
    shorthands: Map<string, string[]>;
} & Conditions;

export function getEvalCompiledResultByKind(evalResult: Record<string, unknown>) {
    const evaluated = getSprinklesMap(evalResult) as Record<string, CompiledResult[]>;
    const flatSprinkles = [] as Array<CompiledSprinkle & { name: string }>;
    const flatRecipes = [] as RecipePatternResult[];

    Object.entries(evaluated).flatMap(([exportName, exportResult]) => {
        const results = castAsArray(exportResult);

        results.forEach((compiledItem) => {
            if (isCompiledSprinkle(compiledItem)) {
                flatSprinkles.push({ ...compiledItem, name: exportName });
            } else if (isRecipePatternResult(compiledItem)) {
                flatRecipes.push({ ...compiledItem, name: exportName });
            }
        });
    });

    const sprinklesClassNames = new Set<string>();
    const sprinkleConfigs = new Map<string, CompiledSprinkleInfo>();
    const compiledSprinkleByDebugId = new Map<
        string,
        CompiledSprinklePropertyValue & { defaultConditionName: string | undefined }
    >();
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

                    compiledSprinkleByDebugId.set(getSprinkleDebugId(propNameOrShorthand, valueName), {
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
                            compiledSprinkleByDebugId.set(getSprinkleDebugId(propNameOrShorthand, valueName), {
                                ...value,
                                defaultConditionName,
                            });
                            // paddingTop_0
                            compiledSprinkleByDebugId.set(getSprinkleDebugId(propName, valueName), {
                                ...value,
                                defaultConditionName,
                            });
                        });
                    }
                });
            }
        });
    });

    const recipesClassNames = new Set<string>();
    const recipesByDebugId = new Map<string, RecipePatternResult>();
    flatRecipes.forEach((recipe) => {
        if (recipe.defaultClassName) {
            recipesClassNames.add(recipe.defaultClassName);
            recipesByDebugId.set(`recipe.${recipe.name}.default`, recipe);
        }

        if (recipe.variantClassNames) {
            Object.entries(recipe.variantClassNames).forEach(([propName, variantMap]) =>
                Object.entries(variantMap).forEach(([propValue, className]) => {
                    recipesClassNames.add(className);
                    recipesByDebugId.set(`recipe.${recipe.name}.variant.${propName}_${propValue}`, recipe);
                })
            );
        }

        if (recipe.compoundVariants) {
            recipe.compoundVariants.forEach(([_variantSelection, className], index) => {
                recipesClassNames.add(className);
                recipesByDebugId.set(`recipe.${recipe.name}.compound.${index}`, recipe);
            });
        }
    });

    // console.dir(
    //     { evaluated, recipesClassNames, variantByDebugId: Array.from(variantByDebugId.keys()) },
    //     { depth: null }
    // );

    return {
        evaluated,
        sprinklesClassNames,
        sprinkleConfigs,
        compiledSprinkleByDebugId,
        recipesClassNames,
        recipesByDebugId,
    };
}
