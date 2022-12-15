import { createSprinkles } from "@vanilla-extract/sprinkles";

export function createBoxSprinklesInternal<Configs extends readonly SprinklesProperties[]>(...definePropsFn: Configs) {
    // console.log("createBoxSprinklesInternal");
    const original = createSprinkles(...definePropsFn);
    const config = getSprinklesConfig(definePropsFn);

    return Object.assign(original, config);
}

export type AnySprinklesFn = {
    (...args: any): string;
    properties: Set<string>;
    conditions: readonly ConditionItem[];
    shorthands: Map<string, string[]>;
};

type VarargParameters<T extends (args: any) => any> = T extends (args: infer P) => any ? P : never;
// export type SprinklesProperties = ReturnType<typeof defineProperties>;
export type SprinklesProperties = VarargParameters<typeof createSprinkles> & Conditions;

export type ConditionItem = {
    defaultCondition: string | false;
    conditionNames: string[];
    responsiveArray?: string[];
};
export type Conditions = {
    conditions: undefined | ConditionItem;
};

// type InferConditions<T> = T extends { conditions: infer C } ? C : never;
// type conditions = InferConditions<typeof responsiveProperties>;
type IsNever<T> = [T] extends [never] ? true : false;

type SprinklesConditions<T extends readonly unknown[], Acc extends readonly unknown[] = []> = T extends [
    infer Head,
    ...infer Tail
]
    ? Head extends { conditions: infer TConditions }
        ? IsNever<TConditions> extends true
            ? SprinklesConditions<Tail, Acc>
            : SprinklesConditions<Tail, [...Acc, TConditions]>
        : SprinklesConditions<Tail, Acc>
    : Acc;

export type SprinkleConditionsNames<T extends readonly unknown[], Acc extends readonly unknown[] = []> = T extends [
    infer Head,
    ...infer Tail
]
    ? Head extends { conditionNames: infer TConditions }
        ? TConditions extends readonly unknown[]
            ? SprinkleConditionsNames<Tail, [...Acc, ...TConditions]>
            : SprinkleConditionsNames<Tail, Acc>
        : SprinkleConditionsNames<Tail, Acc>
    : Acc;

const getSprinklesConfig = <Props extends readonly SprinklesProperties[]>(configs: Props) => {
    const properties = new Set<string>();
    const shorthands = new Map<string, string[]>();
    const conditions = [] as Array<Conditions["conditions"]>;

    configs.forEach((sprinkle) => {
        // TODO filter used conditions
        if (sprinkle.conditions) {
            conditions.push(sprinkle.conditions);
        }

        Object.entries(sprinkle.styles).forEach(([propName, compiledSprinkle]) => {
            properties.add(propName);

            if ("mappings" in compiledSprinkle) {
                shorthands.set(propName, compiledSprinkle.mappings);
            }
        });
    });

    return {
        properties,
        conditions: conditions as any as SprinklesConditions<Props>,
        shorthands,
    };
};
