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

export function defineProperties<Options extends GenericPropsConfig>(options: Options): VanillWindFn<any> {
    const fn = (_options: Options) => "";
    fn.config = options;

    return fn;
}

type ShorthandMap<PropNames> = { [k: string]: PropNames[] };
type DefaultCondition<Conditions> = keyof Conditions;

// TODO aliases = { [k: string]: string[] }
//  ex: { "flex": [{ "flex-grow": 1 }, { "flex-shrink": 1 }, { "flex-basis": "auto" }] }
// ex: { "rounded": [{ "border-radius": "0.25rem" }] }
// https://github.com/vanilla-extract-css/vanilla-extract/discussions/886

export type GenericPropsConfig = {
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
    SprinklesPropsWithConditions<Config> & ConditionsProps<Config>;

export type VanillaWindStyleWithConditionsAndShorthands<Config extends PropsWithConditionsAndShorthandsConfig<any>> =
    SprinklesPropsWithConditions<Config> &
        ShorthandsPropsWithConditions<Config> &
        ConditionsPropsWithShorthands<Config>;

type SprinklesProps<Config extends GenericPropsConfig> = {
    [Prop in keyof Config["properties"]]?: Prop extends keyof CSSProperties
        ? PropValue<Prop, Config["properties"][Prop]>
        : never;
};

type ConditionsProps<Config extends GenericPropsWithConditionsConfig> = {
    [Condition in keyof Config["conditions"]]?: {
        [Prop in keyof Config["properties"]]?: Prop extends keyof CSSProperties
            ? MaybeCondPropValue<Prop, Config["properties"][Prop], Omit<Config["conditions"], Condition>>
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
                ? MaybeCondPropValue<PropName, Config["properties"][PropName], Omit<Conditions, ConditionName>>
                : never
            : PropName extends keyof Config["shorthands"]
            ? Config["shorthands"][PropName] extends Array<infer Prop>
                ? Prop extends keyof CSSProperties
                    ? MaybeCondPropValue<Prop, Config["properties"][Prop], Omit<Conditions, ConditionName>>
                    : never
                : never
            : PropName extends keyof Omit<Conditions, ConditionName>
            ? ConditionsPropsWithShorthands<Config, Omit<Conditions, ConditionName>>[PropName]
            : never;
    };
};

type SprinklesPropsWithConditions<Config extends GenericPropsWithConditionsConfig> = {
    [Prop in keyof Config["properties"]]?: Prop extends keyof CSSProperties
        ? MaybeCondPropValue<Prop, Config["properties"][Prop], Config["conditions"]>
        : never;
};

type ShorthandsProps<Config extends PropsWithShorthandsConfig<any>> = {
    [Shorthand in keyof Config["shorthands"]]?: Config["shorthands"][Shorthand] extends Array<infer Prop>
        ? Prop extends keyof CSSProperties
            ? PropValue<Prop, Config["properties"][Prop]>
            : never
        : never;
};

type ShorthandsPropsWithConditions<Config extends PropsWithConditionsAndShorthandsConfig<any>> = {
    [Shorthand in keyof Config["shorthands"]]?: Config["shorthands"][Shorthand] extends Array<infer Prop>
        ? Prop extends keyof CSSProperties
            ? MaybeCondPropValue<Prop, Config["properties"][Prop], Config["conditions"]>
            : never
        : never;
};

type PropValue<Name extends keyof CSSProperties, Value> =
    | (Value extends boolean ? CSSProperties[Name] : keyof Value | CSSProperties[Name])
    | null;

type MaybeCondPropValue<
    Name extends keyof CSSProperties,
    Value,
    Conditions extends ConfigConditions
> = ValueOrConditionObject<PropValue<Name, Value>, Name, Omit<Conditions, Name>>;

type InnerValueOrConditionObject<Value, Conditions extends ConfigConditions> =
    | Value
    | Partial<Record<keyof Conditions, Value>>;
type ValueOrConditionObject<Value, Name extends string, Conditions extends Omit<ConfigConditions, Name>> =
    | Value
    | {
          [Condition in keyof Conditions]?: InnerValueOrConditionObject<Value, Omit<Conditions, Condition>>;
      };
