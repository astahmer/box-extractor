// needed for the declarations (.d.ts) files to be generated correctly, we can't just use `typeof createSprinkles`
// taken from vanilla-extract

export type ResponsiveArray<Length extends number, Value> = {
    0: Value;
    length: Length;
} & readonly Value[];

export type RequiredResponsiveArray<Length extends number, Value> = {
    0: Exclude<Value, null>;
    length: Length;
} & readonly Value[];

export type ResponsiveArrayConfig<Value> = ResponsiveArray<2 | 3 | 4 | 5 | 6 | 7 | 8, Value>;

export type ResponsiveArrayByMaxLength<MaxLength extends number, Value> = [
    never,
    ResponsiveArray<1, Value | null>,
    ResponsiveArray<1 | 2, Value | null>,
    ResponsiveArray<1 | 2 | 3, Value | null>,
    ResponsiveArray<1 | 2 | 3 | 4, Value | null>,
    ResponsiveArray<1 | 2 | 3 | 4 | 5, Value | null>,
    ResponsiveArray<1 | 2 | 3 | 4 | 5 | 6, Value | null>,
    ResponsiveArray<1 | 2 | 3 | 4 | 5 | 6 | 7, Value | null>,
    ResponsiveArray<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, Value | null>
][MaxLength];

export type RequiredResponsiveArrayByMaxLength<MaxLength extends number, Value> = [
    never,
    RequiredResponsiveArray<1, Value | null>,
    RequiredResponsiveArray<1 | 2, Value | null>,
    RequiredResponsiveArray<1 | 2 | 3, Value | null>,
    RequiredResponsiveArray<1 | 2 | 3 | 4, Value | null>,
    RequiredResponsiveArray<1 | 2 | 3 | 4 | 5, Value | null>,
    RequiredResponsiveArray<1 | 2 | 3 | 4 | 5 | 6, Value | null>,
    RequiredResponsiveArray<1 | 2 | 3 | 4 | 5 | 6 | 7, Value | null>,
    RequiredResponsiveArray<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, Value | null>
][MaxLength];

export type ConditionalPropertyValue = {
    defaultClass: string | undefined;
    conditions: {
        [conditionName: string]: string;
    };
};

export type ConditionalWithResponsiveArrayProperty = {
    responsiveArray: string[];
    values: {
        [valueName: string]: ConditionalPropertyValue;
    };
};

export type ConditionalProperty = {
    values: {
        [valueName: string]: ConditionalPropertyValue;
    };
};

export type UnconditionalProperty = {
    values: {
        [valueName: string]: {
            defaultClass: string;
        };
    };
};

export type ShorthandProperty = {
    mappings: string[];
};

export type SprinklesProperties = {
    styles: {
        [property: string]:
            | ConditionalWithResponsiveArrayProperty
            | ConditionalProperty
            | ShorthandProperty
            | UnconditionalProperty;
    };
} & Conditions;

/** @deprecated - Use `SprinklesProperties` */
export type AtomicStyles = SprinklesProperties;

// end of code taken from vanilla-extract

export type ConditionItem = {
    defaultCondition: string | false;
    conditionNames: string[];
    responsiveArray?: string[];
};
export type Conditions = {
    conditions: undefined | ConditionItem;
};

export type AnySprinklesFn = {
    (...args: any): string;
    properties: Set<string>;
    /** only defined if using createBoxSprinkles */
    conditions?: readonly ConditionItem[];
    /** only defined if using createBoxSprinkles */
    shorthands?: Map<string, string[]>;
};
