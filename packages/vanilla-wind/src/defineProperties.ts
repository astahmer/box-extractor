import type { ConfigConditions, ConfigDynamicProperties, CSSProperties, DynamicPropName } from "./types";

type OptionsProps<DynamicProperties extends ConfigDynamicProperties> = {
    properties: DynamicProperties;
};
type OptionsPropsWithShorthands<
    DynamicProperties extends ConfigDynamicProperties,
    Shorthands extends ShorthandMap<keyof DynamicProperties>
> = {
    properties: DynamicProperties;
    shorthands: Shorthands;
};
type OptionsConditional<DynamicProperties extends ConfigDynamicProperties, Conditions extends ConfigConditions> = {
    properties: DynamicProperties;
    conditions: Conditions;
    defaultCondition: keyof Conditions;
};
type OptionsConditionalWithShorthands<
    DynamicProperties extends ConfigDynamicProperties,
    Conditions extends ConfigConditions,
    Shorthands extends ShorthandMap<keyof DynamicProperties>
> = {
    properties: DynamicProperties;
    conditions: Conditions;
    defaultCondition: keyof Conditions;
    shorthands: Shorthands;
};

// function overloading DO matter, most specific first, first found first used
// also, there could be 1 big option & 1 return generic that would cover all the cases (props+shorthands?+conditions?)
// but i'm pretty sure it would be less performant just to avoid some code duplication
// inspired from rainbow-sprinkles typings
// https://github.com/wayfair/rainbow-sprinkles/blob/51822b907ce88c26918a3614946ece513f0749c9/packages/rainbow-sprinkles/src/defineProperties.ts
// and this tweet https://twitter.com/markdalgleish/status/1615106542298365957

// Conditional Dynamic Properties + Shorthands
export function defineProperties<
    DynamicProperties extends ConfigDynamicProperties,
    Conditions extends ConfigConditions,
    Shorthands extends { [k: string]: Array<keyof DynamicProperties> }
>(
    options: OptionsConditionalWithShorthands<DynamicProperties, Conditions, Shorthands>
): VanillWindFn<
    VanillaWindStyleWithConditionsAndShorthands<
        OptionsConditionalWithShorthands<DynamicProperties, Conditions, Shorthands>
    >
>;

// Conditional Dynamic Properties
export function defineProperties<
    DynamicProperties extends ConfigDynamicProperties,
    Conditions extends ConfigConditions
>(
    options: OptionsConditional<DynamicProperties, Conditions>
): VanillWindFn<VanillaWindStyleWithConditions<OptionsConditional<DynamicProperties, Conditions>>>;

// Dynamic Properties + Shorthands
export function defineProperties<
    DynamicProperties extends ConfigDynamicProperties,
    Shorthands extends { [k: string]: Array<keyof DynamicProperties> }
>(
    options: OptionsPropsWithShorthands<DynamicProperties, Shorthands>
): VanillWindFn<VanillaWindStyleWithShorthands<OptionsPropsWithShorthands<DynamicProperties, Shorthands>>>;

// Dynamic Properties
export function defineProperties<DynamicProperties extends ConfigDynamicProperties>(
    options: OptionsProps<DynamicProperties>
): VanillWindFn<VanillaWindStyle<OptionsProps<DynamicProperties>>>;

export function defineProperties(options: any): any {
    return options;
}

const brandColor = {
    "brand.50": "#F7FAFC",
    "brand.100": "#EFF6F8",
    "brand.200": "#D7E8EE",
    "brand.300": "#BFDAE4",
    "brand.400": "#90BFD0",
    "brand.500": "#60A3BC",
    "brand.600": "#5693A9",
    "brand.700": "#3A6271",
    "brand.800": "#2B4955",
    "brand.900": "#1D3138",
};

const tw = defineProperties({
    conditions: {
        small: { selector: ".small" },
        large: { selector: ".large" },
        dark: { selector: ".dark" },
        light: { selector: ".light" },
    },
    defaultCondition: "small",
    properties: {
        color: true,
        display: true,
        backgroundColor: brandColor,
        borderColor: brandColor,
        width: {
            "1/2": "50%",
        },
    },
    shorthands: {
        w: ["backgroundColor", "color"],
    },
});
tw({
    color: "#12321",
    // backgroundColor: [{ dark: "brand.50", hover: "" }, { light: "brand.100"}],
    display: { dark: "flex" },
    // borderColor: { dark: "brand.50" },

    // display: "flex"
});

// tw({
//     p: 24,
//     rounded: 'lg',
//     bg: 'blue-500',
//     hover: { bg: 'blue-700' },
//     dark: {
//       bg: 'zinc-800',
//       hover: { bg: 'zinc-900' },
//     },
//   })

type ShorthandMap<PropNames> = { [k: string]: PropNames[] };
type DefaultCondition<Conditions> = keyof Conditions;
type GenericPropsConfig = {
    properties: ConfigDynamicProperties;
    conditions?: ConfigConditions;
    defaultCondition?: keyof ConfigConditions;
    shorthands?: ShorthandMap<string>;
};
type GenericPropsWithConditionsConfig = {
    properties: ConfigDynamicProperties;
    conditions: ConfigConditions;
    defaultCondition: DefaultCondition<any>;
    shorthands?: ShorthandMap<DynamicPropName>;
};

type PropsWithShorthandsConfig<PropNames> = {
    properties: ConfigDynamicProperties;
    shorthands: { [k: string]: PropNames[] };
};
type PropsConfig = {
    properties: ConfigDynamicProperties;
};
type PropsWithConditionsConfig = {
    properties: ConfigDynamicProperties;
    conditions: ConfigConditions;
    defaultCondition: DefaultCondition<any>;
};
type PropsWithConditionsAndShorthandsConfig<PropNames> = {
    properties: ConfigDynamicProperties;
    conditions: ConfigConditions;
    defaultCondition: DefaultCondition<any>;
    shorthands: { [k: string]: PropNames[] };
};

type VanillWindFn<Props> = (props: Props) => string;
export type VanillaWindStyle<Config extends PropsConfig> = SprinklesProps<Config>;

export type VanillaWindStyleWithShorthands<Config extends PropsWithShorthandsConfig<any>> = SprinklesProps<Config> &
    ShorthandsProps<Config>;

export type VanillaWindStyleWithConditions<Config extends PropsWithConditionsConfig> =
    SprinklesPropsWithConditions<Config>;

export type VanillaWindStyleWithConditionsAndShorthands<Config extends PropsWithConditionsAndShorthandsConfig<any>> =
    SprinklesPropsWithConditions<Config> & ShorthandsPropsWithConditions<Config>;

type SprinklesProps<Config extends GenericPropsConfig> = {
    [Prop in keyof Config["properties"]]?: Prop extends keyof CSSProperties
        ? PropValue<Prop, Config["properties"][Prop]>
        : never;
};

type SprinklesPropsWithConditions<Config extends GenericPropsWithConditionsConfig> = {
    [Prop in keyof Config["properties"]]?: Prop extends keyof CSSProperties
        ? MaybeCondPropValue<Prop, Config["properties"][Prop], Config["conditions"]>
        : never;
};

type ShorthandsProps<Config extends GenericPropsConfig> = {
    [Shorthand in keyof NonNullable<Config["shorthands"]>]?: NonNullable<Config["shorthands"]>[Shorthand] extends Array<
        infer Prop
    >
        ? Prop extends keyof CSSProperties
            ? PropValue<Prop, Config["properties"][Prop]>
            : never
        : never;
};

type ShorthandsPropsWithConditions<Config extends GenericPropsWithConditionsConfig> = {
    [Shorthand in keyof NonNullable<Config["shorthands"]>]?: NonNullable<Config["shorthands"]>[Shorthand] extends Array<
        infer Prop
    >
        ? Prop extends keyof CSSProperties
            ? MaybeCondPropValue<Prop, Config["properties"][Prop], Config["conditions"]>
            : never
        : never;
};

type CastPropValue<Name extends keyof CSSProperties, Value> = Value extends boolean
    ? CSSProperties[Name]
    : keyof Value | CSSProperties[Name];
type PropValue<Name extends keyof CSSProperties, Value> = CastPropValue<Name, Value> | null;

type MaybeCondPropValue<
    Name extends keyof CSSProperties,
    Value,
    Conditions extends ConfigConditions
> = ValueOrConditionObject<CastPropValue<Name, Value>, Conditions> | null;

type ValueOrConditionObject<T, Conditions extends ConfigConditions> = T | Partial<Record<keyof Conditions, T | null>>;

// type Aaazaz = NonNullable<typeof oui["shorthands"]>;
// type Aaa = ShorthandsProperties<typeof oui>;

// type Oui = SprinklesProps<typeof oui>;
// const oazazaui: Oui = {
//     color: "#23",
//     width: "1/2",
//     w: "fit-content",
//     // w: "#23"
// };

// Conditional Dynamic Properties + Shorthands
// export function definePropertiesRainbow<
//     DynamicProperties extends ConfigDynamicProperties,
//     Conditions extends ConfigConditions,
//     Shorthands extends { [k: string]: Array<keyof DynamicProperties> }
// >(
//     options: OptionsConditionalDynamic<DynamicProperties, Conditions, Shorthands>
// ): ReturnConditionalDynamic<DynamicProperties, Conditions> & ReturnShorthands<Shorthands>;

// // Dynamic Properties + Shorthands
// export function definePropertiesRainbow<
//     DynamicProperties extends ConfigDynamicProperties,
//     Shorthands extends { [k: string]: Array<keyof DynamicProperties> }
// >(
//     options: OptionsDynamic<DynamicProperties, Shorthands>
// ): ReturnDynamic<DynamicProperties> & ReturnShorthands<Shorthands>;
// export function definePropertiesRainbow(options: any): any {
//     return options;
// }

// const rainbow = definePropertiesRainbow({
//     properties: {
//         color: true,
//         width: {
//             "1/2": "50%",
//         },
//     },
// });
// // rainbow.config.color.dynamicScale

// type ConditionalMap<Conditions> = {
//     default: string;
//     conditions: Record<keyof Conditions, string>;
// };

// type ReturnConditionalDynamic<
//     DynamicProperties extends ConfigDynamicProperties,
//     Conditions extends ConfigConditions
// > = {
//     config: {
//         [Property in keyof DynamicProperties]: {
//             dynamic: ConditionalMap<Conditions>;
//             dynamicScale: DynamicProperties[Property];
//             name: Property;
//             vars: ConditionalMap<Conditions>;
//         };
//     };
// };
// type ReturnDynamic<DynamicProperties extends ConfigDynamicProperties> = {
//     config: {
//         [Property in keyof DynamicProperties]: {
//             dynamic: { default: string };
//             dynamicScale: DynamicProperties[Property];
//             name: Property;
//             vars: { default: string };
//         };
//     };
// };

// type ReturnShorthands<Shorthands extends { [k: string]: Array<string | number | symbol> }> = {
//     config: {
//         [Shorthand in keyof Shorthands]: {
//             mappings: Shorthands[Shorthand];
//         };
//     };
// };

/**
 * Simplify a type by merging intersections if possible
 * @param T - type to simplify
 */
// export type Simplify<T> = T extends unknown ? { [K in keyof T]: T[K] } : T;

// /**
//  * Merge two types into a single type
//  * @param T - first type
//  * @param U - second type
//  */
// export type Merge<T, U> = Simplify<T & U>;
