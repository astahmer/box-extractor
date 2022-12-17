import type { AnySprinklesFn, SprinkleConditionsNames } from "@box-extractor/vanilla-extract";

export type EscapeHatchProps<T> = {
    [K in keyof T as K extends keyof React.CSSProperties ? `__${K}` : number]: Exclude<T[K], object> | (string & {});
};

export type Tokens<SprinklesFn extends AnySprinklesFn> = Parameters<SprinklesFn>[0];

export type ReversedConditionsProps<SprinklesFn> = SprinklesFn extends AnySprinklesFn
    ? IsDefined<SprinklesFn["conditions"]> extends true
        ? {
              [ConditionName in SprinkleConditionsNames<
                  NonNullable<SprinklesFn["conditions"]>
              >[number] as `_${ConditionName}`]?: ConditionPropsByName<SprinklesFn, ConditionName>;
          }
        : {}
    : {};

type ConditionPropsByName<
    SprinklesFn extends AnySprinklesFn,
    ConditionName extends string,
    TTokens = Tokens<SprinklesFn>
> = Partial<
    PickDefined<{
        [PropName in keyof TTokens]-?: IsDefined<Extract<TTokens[PropName], object>> extends true
            ? Extract<TTokens[PropName], object> extends { [K in ConditionName]?: infer PropValue }
                ? PropValue
                : never
            : never;
    }>
>;

type IsDefined<T> = [T] extends [never] ? false : true;
type PickDefined<T> = Pick<T, { [K in keyof T]: T[K] extends never ? never : K }[keyof T]>;
