import type { ConfigConditions, ConfigDynamicProperties, CSSProperties, DynamicPropName } from "./types";

type OptionsProps<DynamicProperties extends ConfigDynamicProperties, Strict extends boolean = false> = {
    properties: DynamicProperties;
    strict?: Strict;
};
type OptionsPropsWithShorthands<
    DynamicProperties extends ConfigDynamicProperties,
    Shorthands extends ShorthandMap<keyof DynamicProperties>,
    Strict extends boolean = false
> = {
    properties: DynamicProperties;
    shorthands: Shorthands;
    strict?: Strict;
};
type OptionsConditional<
    DynamicProperties extends ConfigDynamicProperties,
    Conditions extends ConfigConditions,
    Strict extends boolean = false
> = {
    properties: DynamicProperties;
    conditions: Conditions;
    strict?: Strict;
};
type OptionsConditionalWithShorthands<
    DynamicProperties extends ConfigDynamicProperties,
    Conditions extends ConfigConditions,
    Shorthands extends ShorthandMap<keyof DynamicProperties>,
    Strict extends boolean = false
> = {
    properties: DynamicProperties;
    conditions: Conditions;
    shorthands: Shorthands;
    strict?: Strict;
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
    Shorthands extends { [k: string]: Array<keyof DynamicProperties> },
    Strict extends boolean = false
>(
    options: OptionsConditionalWithShorthands<DynamicProperties, Conditions, Shorthands, Strict>
): VanillWindFn<
    VanillaWindStyleWithConditionsAndShorthands<
        OptionsConditionalWithShorthands<DynamicProperties, Conditions, Shorthands, Strict>
    >
>;

// Conditional Dynamic Properties
export function defineProperties<
    DynamicProperties extends ConfigDynamicProperties,
    Conditions extends ConfigConditions,
    Strict extends boolean = false
>(
    options: OptionsConditional<DynamicProperties, Conditions>
): VanillWindFn<VanillaWindStyleWithConditions<OptionsConditional<DynamicProperties, Conditions, Strict>>>;

// Dynamic Properties + Shorthands
export function defineProperties<
    DynamicProperties extends ConfigDynamicProperties,
    Shorthands extends { [k: string]: Array<keyof DynamicProperties> },
    Strict extends boolean = false
>(
    options: OptionsPropsWithShorthands<DynamicProperties, Shorthands, Strict>
): VanillWindFn<VanillaWindStyleWithShorthands<OptionsPropsWithShorthands<DynamicProperties, Shorthands, Strict>>>;

// Dynamic Properties
export function defineProperties<DynamicProperties extends ConfigDynamicProperties, Strict extends boolean = false>(
    options: OptionsProps<DynamicProperties, Strict>
): VanillWindFn<VanillaWindStyle<OptionsProps<DynamicProperties, Strict>>>;

export function defineProperties<Options extends GenericPropsConfig>(options: Options): VanillWindFn<any> {
    const fn = (_options: Options) => "";
    fn.config = options;

    return fn;
}

type ShorthandMap<PropNames> = { [k: string]: PropNames[] };

// TODO aliases = { [k: string]: string[] }
//  ex: { "flex": [{ "flex-grow": 1 }, { "flex-shrink": 1 }, { "flex-basis": "auto" }] }
// ex: { "rounded": [{ "border-radius": "0.25rem" }] }
// https://github.com/vanilla-extract-css/vanilla-extract/discussions/886

export type GenericPropsConfig = {
    properties: ConfigDynamicProperties;
    conditions?: ConfigConditions;
    shorthands?: ShorthandMap<string>;
    strict?: boolean;
};
type GenericPropsWithConditionsConfig = {
    properties: ConfigDynamicProperties;
    conditions: ConfigConditions;
    shorthands?: ShorthandMap<DynamicPropName>;
    strict?: boolean;
};

type PropsWithShorthandsConfig<PropNames> = {
    properties: ConfigDynamicProperties;
    shorthands: { [k: string]: PropNames[] };
    strict?: boolean;
};
type PropsConfig = {
    properties: ConfigDynamicProperties;
    strict?: boolean;
};
type PropsWithConditionsConfig = {
    properties: ConfigDynamicProperties;
    conditions: ConfigConditions;
    strict?: boolean;
};
type PropsWithConditionsAndShorthandsConfig<PropNames> = {
    properties: ConfigDynamicProperties;
    conditions: ConfigConditions;
    shorthands: { [k: string]: PropNames[] };
    strict?: boolean;
};

type VanillWindFn<Props> = (props: Props) => string;
export type VanillaWindStyle<Config extends PropsConfig> = SprinklesProps<Config>;

export type VanillaWindStyleWithShorthands<Config extends PropsWithShorthandsConfig<any>> = SprinklesProps<Config> &
    ShorthandsProps<Config>;

export type VanillaWindStyleWithConditions<Config extends PropsWithConditionsConfig> =
    SprinklesPropsWithConditions<Config> & ConditionsProps<Config>;

export type VanillaWindStyleWithConditionsAndShorthands<Config extends PropsWithConditionsAndShorthandsConfig<any>> =
    SprinklesPropsWithConditions<Config> &
        ShorthandsPropsWithConditions<Config> &
        ConditionsPropsWithShorthands<Config>;

type SprinklesProps<Config extends GenericPropsConfig> = {
    [Prop in keyof Config["properties"]]?: Prop extends keyof CSSProperties
        ? PropValue<Prop, Config["properties"][Prop], Config["strict"]>
        : never;
};

type ConditionsProps<Config extends GenericPropsWithConditionsConfig> = {
    [Condition in keyof Config["conditions"]]?: {
        [Prop in keyof Config["properties"]]?: Prop extends keyof CSSProperties
            ? MaybeCondPropValue<
                  Prop,
                  Config["properties"][Prop],
                  Omit<Config["conditions"], Condition>,
                  Config["strict"]
              >
            : never;
    };
};

type ConditionsPropsWithShorthands<
    Config extends PropsWithConditionsAndShorthandsConfig<any>,
    Conditions extends ConfigConditions = Config["conditions"]
> = {
    [ConditionName in keyof Conditions]?: {
        [PropName in
            | keyof Config["properties"]
            | keyof Config["shorthands"]
            | keyof Conditions]?: PropName extends keyof Config["properties"]
            ? PropName extends keyof CSSProperties
                ? MaybeCondPropValue<
                      PropName,
                      Config["properties"][PropName],
                      Omit<Conditions, ConditionName>,
                      Config["strict"]
                  >
                : never
            : PropName extends keyof Config["shorthands"]
            ? Config["shorthands"][PropName] extends Array<infer Prop>
                ? Prop extends keyof CSSProperties
                    ? MaybeCondPropValue<
                          Prop,
                          Config["properties"][Prop],
                          Omit<Conditions, ConditionName>,
                          Config["strict"]
                      >
                    : never
                : never
            : PropName extends keyof Omit<Conditions, ConditionName>
            ? ConditionsPropsWithShorthands<Config, Omit<Conditions, ConditionName>>[PropName]
            : never;
    };
};

type SprinklesPropsWithConditions<Config extends GenericPropsWithConditionsConfig> = {
    [Prop in keyof Config["properties"]]?: Prop extends keyof CSSProperties
        ? MaybeCondPropValue<Prop, Config["properties"][Prop], Config["conditions"], Config["strict"]>
        : never;
};

type ShorthandsProps<Config extends PropsWithShorthandsConfig<any>> = {
    [Shorthand in keyof Config["shorthands"]]?: Config["shorthands"][Shorthand] extends Array<infer Prop>
        ? Prop extends keyof CSSProperties
            ? PropValue<Prop, Config["properties"][Prop], Config["strict"]>
            : never
        : never;
};

type ShorthandsPropsWithConditions<Config extends PropsWithConditionsAndShorthandsConfig<any>> = {
    [Shorthand in keyof Config["shorthands"]]?: Config["shorthands"][Shorthand] extends Array<infer Prop>
        ? Prop extends keyof CSSProperties
            ? MaybeCondPropValue<Prop, Config["properties"][Prop], Config["conditions"], Config["strict"]>
            : never
        : never;
};

type PropValue<Name extends keyof CSSProperties, Value, Strict> =
    | (Value extends boolean
          ? CSSProperties[Name]
          : Strict extends true | undefined
          ? keyof Value
          : keyof Value | CSSProperties[Name])
    | null;

type MaybeCondPropValue<
    Name extends keyof CSSProperties,
    Value,
    Conditions extends ConfigConditions,
    Strict
> = ValueOrConditionObject<PropValue<Name, Value, Strict>, Name, Omit<Conditions, Name>>;

type InnerValueOrConditionObject<Value, Conditions extends ConfigConditions> =
    | Value
    | Partial<Record<keyof Conditions, Value>>;
type ValueOrConditionObject<Value, Name extends string, Conditions extends Omit<ConfigConditions, Name>> =
    | Value
    | {
          [Condition in keyof Conditions]?: InnerValueOrConditionObject<Value, Omit<Conditions, Condition>>;
      };
