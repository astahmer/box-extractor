import type {
    ConditionalProperty,
    ConditionalPropertyValue,
    ConditionalWithResponsiveArrayProperty,
    ConditionItem,
    ResponsiveArrayByMaxLength,
    ShorthandProperty,
    SprinklesProperties,
    UnconditionalProperty,
} from "./types";

// needed for the declarations (.d.ts) files to be generated correctly, we can't just use `typeof createSprinkles`
// taken from vanilla-extract

type ResponsiveArrayVariant<
    RA extends { length: number },
    Values extends string | number | symbol
> = ResponsiveArrayByMaxLength<RA["length"], Values | null>;

type ConditionalStyle<Values extends { [key: string]: ConditionalPropertyValue }> =
    | (Values[keyof Values]["defaultClass"] extends string ? keyof Values : never)
    | {
          [Condition in keyof Values[keyof Values]["conditions"]]?: keyof Values;
      };

type ConditionalStyleWithResponsiveArray<
    Values extends { [key: string]: ConditionalPropertyValue },
    RA extends { length: number }
> = ConditionalStyle<Values> | ResponsiveArrayVariant<RA, keyof Values>;

type ChildSprinkleProps<Sprinkles extends SprinklesProperties["styles"]> = {
    [Prop in keyof Sprinkles]?: Sprinkles[Prop] extends ConditionalWithResponsiveArrayProperty
        ? ConditionalStyleWithResponsiveArray<Sprinkles[Prop]["values"], Sprinkles[Prop]["responsiveArray"]>
        : Sprinkles[Prop] extends ConditionalProperty
        ? ConditionalStyle<Sprinkles[Prop]["values"]>
        : Sprinkles[Prop] extends ShorthandProperty
        ? Sprinkles[Sprinkles[Prop]["mappings"][number]] extends ConditionalWithResponsiveArrayProperty
            ? ConditionalStyleWithResponsiveArray<
                  Sprinkles[Sprinkles[Prop]["mappings"][number]]["values"],
                  Sprinkles[Sprinkles[Prop]["mappings"][number]]["responsiveArray"]
              >
            : Sprinkles[Sprinkles[Prop]["mappings"][number]] extends ConditionalProperty
            ? ConditionalStyle<Sprinkles[Sprinkles[Prop]["mappings"][number]]["values"]>
            : Sprinkles[Sprinkles[Prop]["mappings"][number]] extends UnconditionalProperty
            ? keyof Sprinkles[Sprinkles[Prop]["mappings"][number]]["values"]
            : never
        : Sprinkles[Prop] extends UnconditionalProperty
        ? keyof Sprinkles[Prop]["values"]
        : never;
};

type SprinkleProps<Args extends readonly any[]> = Args extends [infer L, ...infer R]
    ? (L extends SprinklesProperties ? ChildSprinkleProps<L["styles"]> : never) & SprinkleProps<R>
    : {};

export type SprinklesFn<Args extends readonly SprinklesProperties[]> = ((props: SprinkleProps<Args>) => string) & {
    properties: Set<keyof SprinkleProps<Args>>;
    /** only defined if using createBoxSprinkles */
    conditions?: readonly ConditionItem[];
    /** only defined if using createBoxSprinkles */
    shorthands?: Map<string, string[]>;
};
// end of code taken from vanilla-extract

type IsNever<T> = [T] extends [never] ? true : false;

export type SprinklesConditions<T extends readonly unknown[], Acc extends readonly unknown[] = []> = T extends [
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
