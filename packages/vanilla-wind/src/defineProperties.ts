import type { ConfigConditions, ConfigDynamicProperties, CSSProperties } from "./types";

type TProps<DynamicProperties extends ConfigDynamicProperties, Strict extends boolean | undefined> = {
    properties: DynamicProperties;
    strict?: Strict | undefined;
};

type ShorthandMap<PropNames> = { [k: string]: PropNames[] };
type TShorthands<Shorthands extends ShorthandMap<keyof CSSProperties>> = {
    shorthands: Shorthands;
};
type TShorthandsByPropNames<PropNames> = {
    shorthands: { [k: string]: PropNames[] };
};

type TPropsWithShorthands<
    DynamicProperties extends ConfigDynamicProperties,
    Shorthands extends ShorthandMap<keyof DynamicProperties>,
    Strict extends boolean | undefined
> = {
    properties: DynamicProperties;
    strict?: Strict | undefined;
    shorthands: Shorthands;
};
type TPropsWithConditions<
    DynamicProperties extends ConfigDynamicProperties,
    Conditions extends ConfigConditions,
    Strict extends boolean | undefined
> = {
    properties: DynamicProperties;
    strict?: Strict | undefined;
    conditions: Conditions;
};
type TConditions<Conditions extends ConfigConditions> = {
    conditions: Conditions;
};
type TConditionsWithShorthands<
    Conditions extends ConfigConditions,
    Shorthands extends ShorthandMap<keyof CSSProperties>
> = {
    conditions: Conditions;
    shorthands: Shorthands;
};
type TPropsWithConditionsWithShorthands<
    DynamicProperties extends ConfigDynamicProperties,
    Conditions extends ConfigConditions,
    Shorthands extends ShorthandMap<keyof DynamicProperties>,
    Strict extends boolean | undefined
> = {
    properties: DynamicProperties;
    strict?: Strict | undefined;
    conditions: Conditions;
    shorthands: Shorthands;
};

// function overloading DO matter, most specific first, first found first used
// also, there could be 1 big option & 1 return generic that would cover all the cases (props+shorthands?+conditions?)
// but i'm pretty sure it would be less performant just to avoid some code duplication
// inspired from rainbow-sprinkles typings
// https://github.com/wayfair/rainbow-sprinkles/blob/51822b907ce88c26918a3614946ece513f0749c9/packages/rainbow-sprinkles/src/defineProperties.ts
// and this tweet https://twitter.com/markdalgleish/status/1615106542298365957

// Any CSSProperties
export function defineProperties(): TReturnFn<CSSProperties>;

// Conditional Dynamic Properties + Shorthands
export function defineProperties<
    DynamicProperties extends ConfigDynamicProperties,
    Conditions extends ConfigConditions,
    Shorthands extends { [k: string]: Array<keyof DynamicProperties> },
    Strict extends boolean | undefined
>(
    options: TPropsWithConditionsWithShorthands<DynamicProperties, Conditions, Shorthands, Strict>
): TReturnFn<
    OptWithPropsWithConditionsWithShorthands<
        TPropsWithConditionsWithShorthands<DynamicProperties, Conditions, Shorthands, Strict>
    >
>;

// Conditional Dynamic Properties
export function defineProperties<
    DynamicProperties extends ConfigDynamicProperties,
    Conditions extends ConfigConditions,
    Strict extends boolean | undefined
>(
    options: TPropsWithConditions<DynamicProperties, Conditions, Strict>
): TReturnFn<OptWithPropsWithConditions<TPropsWithConditions<DynamicProperties, Conditions, Strict>>>;

// Dynamic Properties + Shorthands
export function defineProperties<
    DynamicProperties extends ConfigDynamicProperties,
    Shorthands extends { [k: string]: Array<keyof DynamicProperties> },
    Strict extends boolean | undefined
>(
    options: TPropsWithShorthands<DynamicProperties, Shorthands, Strict>
): TReturnFn<OptPropsWithShorthands<TPropsWithShorthands<DynamicProperties, Shorthands, Strict>>>;

// Dynamic Properties
export function defineProperties<DynamicProperties extends ConfigDynamicProperties, Strict extends boolean | undefined>(
    options: TProps<DynamicProperties, Strict>
): TReturnFn<SprinklesProps<TProps<DynamicProperties, Strict>>>;

// Conditions + Shorthands
export function defineProperties<
    Conditions extends ConfigConditions,
    Shorthands extends { [k: string]: Array<keyof CSSProperties> }
>(
    options: TConditionsWithShorthands<Conditions, Shorthands>
): TReturnFn<OptWithConditionsWithShorthands<TConditionsWithShorthands<Conditions, Shorthands>>>;

// Shorthands only
export function defineProperties<Shorthands extends { [k: string]: Array<keyof CSSProperties> }>(
    options: TShorthands<Shorthands>
): TReturnFn<CSSProperties & OptWithShorthands<TShorthands<Shorthands>>>;

// Conditions only
export function defineProperties<Conditions extends ConfigConditions>(
    options: TConditions<Conditions>
): TReturnFn<OptConditionsOnly<TConditions<Conditions>>>;

export function defineProperties<Options extends GenericConfig>(options?: any): TReturnFn<any> {
    const fn = (_options: Options) => "";
    fn.config = options;

    return fn;
}

// TODO aliases = { [k: string]: string[] }
//  ex: { "flex": [{ "flex-grow": 1 }, { "flex-shrink": 1 }, { "flex-basis": "auto" }] }
// ex: { "rounded": [{ "border-radius": "0.25rem" }] }
// https://github.com/vanilla-extract-css/vanilla-extract/discussions/886

// TODO 2nd argument on defineProperties + TReturnFn = style generation options to override plugin global options ?
// ex: `const style = defineProperties({ ... }, { mode: "atomic" })` and `className={style({ ... }, { mode: "grouped" })}`

export type GenericConfig = {
    properties?: ConfigDynamicProperties;
    conditions?: ConfigConditions;
    shorthands?: ShorthandMap<string>;
    strict?: boolean;
    // aliases?: { [k: string]: string[] };
};
type GenericWithPropsAndConditions = AnyProps & AnyConditions & Pick<GenericConfig, "properties" | "strict">;

type AnyProps = TProps<ConfigDynamicProperties, any>;
type AnyConditions = TConditions<ConfigConditions>;
type AnyShorthands = TShorthandsByPropNames<string>;
type AnyPropsAndShorthands<PropNames> = AnyProps & TShorthandsByPropNames<PropNames>;
type AnyPropsAndConditions = AnyProps & AnyConditions;
type AnyPropsAndConditionsAndShorthands<PropNames> = AnyConditions & AnyPropsAndShorthands<PropNames>;
type AnyConditionsAndShorthands<PropNames> = AnyConditions & TShorthandsByPropNames<PropNames>;

type TReturnFn<Props> = (props: Props) => string;

type OptConditionsOnly<Config extends AnyConditions> = SprinklesWithoutPropsWithConditions<Config> &
    ConditionsWithoutProps<Config>;

type OptWithConditionsWithShorthands<Config extends AnyShorthands & AnyConditions> =
    SprinklesWithoutPropsWithConditions<Config> &
        ConditionsWithoutPropsWithShorthands<Config> &
        ShorthandsWithoutPropsWithConditions<Config>;

type OptPropsWithShorthands<Config extends AnyPropsAndShorthands<any>> = SprinklesProps<Config> &
    ShorthandsProps<Config>;

type OptWithShorthands<Config extends AnyShorthands> = ShorthandsWithoutProps<Config>;

type OptWithPropsWithConditions<Config extends AnyPropsAndConditions> = SprinklesPropsWithConditions<Config> &
    ConditionsProps<Config>;

type OptWithPropsWithConditionsWithShorthands<Config extends AnyPropsAndConditionsAndShorthands<any>> =
    SprinklesPropsWithConditions<Config> &
        ShorthandsPropsWithConditions<Config> &
        ConditionsPropsWithShorthands<Config>;

type SprinklesProps<Config extends AnyProps> = {
    [Prop in keyof Config["properties"]]?: Prop extends keyof CSSProperties
        ? PropValue<Prop, Config["properties"][Prop], Config["strict"]>
        : never;
};
type SprinklesWithoutPropsWithConditions<Config extends AnyConditions> = {
    [Prop in keyof CSSProperties]?: Prop extends keyof CSSProperties
        ? MaybeCondPropValue<Prop, CSSProperties[Prop], Config["conditions"], false>
        : never;
};

type ConditionsProps<Config extends GenericWithPropsAndConditions> = {
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

type ConditionsWithoutProps<Config extends AnyConditions> = {
    [Condition in keyof Config["conditions"]]?: {
        [Prop in keyof CSSProperties]?: Prop extends keyof CSSProperties
            ? MaybeCondPropValue<Prop, CSSProperties[Prop], Omit<Config["conditions"], Condition>, false>
            : never;
    };
};

type ConditionsPropsWithShorthands<
    Config extends AnyPropsAndConditionsAndShorthands<any>,
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

type ConditionsWithoutPropsWithShorthands<
    Config extends AnyConditionsAndShorthands<any>,
    Conditions extends ConfigConditions = Config["conditions"]
> = {
    [ConditionName in keyof Conditions]?: {
        [PropName in
            | keyof CSSProperties
            | keyof Config["shorthands"]
            | keyof Conditions]?: PropName extends keyof CSSProperties
            ? PropName extends keyof CSSProperties
                ? MaybeCondPropValue<PropName, CSSProperties[PropName], Omit<Conditions, ConditionName>, false>
                : never
            : PropName extends keyof Config["shorthands"]
            ? Config["shorthands"][PropName] extends Array<infer Prop>
                ? Prop extends keyof CSSProperties
                    ? MaybeCondPropValue<Prop, CSSProperties[Prop], Omit<Conditions, ConditionName>, false>
                    : never
                : never
            : PropName extends keyof Omit<Conditions, ConditionName>
            ? ConditionsWithoutPropsWithShorthands<Config, Omit<Conditions, ConditionName>>[PropName]
            : never;
    };
};

type SprinklesPropsWithConditions<Config extends GenericWithPropsAndConditions> = {
    [Prop in keyof Config["properties"]]?: Prop extends keyof CSSProperties
        ? MaybeCondPropValue<Prop, Config["properties"][Prop], Config["conditions"], Config["strict"]>
        : never;
};

type ShorthandsProps<Config extends AnyPropsAndShorthands<any>> = {
    [Shorthand in keyof Config["shorthands"]]?: Config["shorthands"][Shorthand] extends Array<infer Prop>
        ? Prop extends keyof CSSProperties
            ? PropValue<Prop, Config["properties"][Prop], Config["strict"]>
            : never
        : never;
};

type ShorthandsWithoutProps<Config extends AnyShorthands> = {
    [Shorthand in keyof Config["shorthands"]]?: Config["shorthands"][Shorthand] extends Array<infer Prop>
        ? Prop extends keyof CSSProperties
            ? PropValue<Prop, CSSProperties[Prop], false>
            : never
        : never;
};

type ShorthandsPropsWithConditions<Config extends AnyPropsAndConditionsAndShorthands<any>> = {
    [Shorthand in keyof Config["shorthands"]]?: Config["shorthands"][Shorthand] extends Array<infer Prop>
        ? Prop extends keyof CSSProperties
            ? MaybeCondPropValue<Prop, Config["properties"][Prop], Config["conditions"], Config["strict"]>
            : never
        : never;
};

type ShorthandsWithoutPropsWithConditions<Config extends AnyConditionsAndShorthands<any>> = {
    [Shorthand in keyof Config["shorthands"]]?: Config["shorthands"][Shorthand] extends Array<infer Prop>
        ? Prop extends keyof CSSProperties
            ? MaybeCondPropValue<Prop, CSSProperties[Prop], Config["conditions"], false>
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
