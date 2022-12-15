import type { PropsWithChildren } from "react";
import type { AnySprinklesFn, SprinkleConditionsNames } from "@box-extractor/vanilla-extract";
import { getBoxProps } from "@box-extractor/vanilla-extract";
import { ThemeSprinkles, themeSprinkles } from "../theme/sprinkles.css";

const defaultElement = "div";

export const Box = <TType extends React.ElementType = typeof defaultElement>({
    children,
    as,
    ...props
}: PolymorphicComponentProps<BoxProps, TType>) => {
    const Component = as ?? defaultElement;
    const boxProps = getBoxProps(props, themeSprinkles);
    // boxProps.otherProps console.log(boxProps);
    const className = themeSprinkles(boxProps.sprinklesProps);
    return <Component className={className} children={children} style={boxProps.sprinklesEscapeHatchProps} />;
};

export type BoxProps = PropsWithChildren<ThemeSprinkles> &
    EscapeHatchProps<ThemeSprinkles> &
    ReversedConditionsProps<typeof themeSprinkles>;

type AsProp<TType extends React.ElementType = React.ElementType> = {
    as?: TType;
};

type PolymorphicComponentProps<Props, TType extends React.ElementType> = Props &
    AsProp<TType> &
    Omit<React.ComponentProps<TType>, keyof AsProp | keyof Props>;

type EscapeHatchProps<T> = {
    [K in keyof T as K extends keyof React.CSSProperties ? `__${K}` : number]: Exclude<T[K], object> | (string & {});
};

type Tokens<SprinklesFn extends AnySprinklesFn> = Parameters<SprinklesFn>[0];

type ReversedConditionsProps<SprinklesFn> = SprinklesFn extends AnySprinklesFn
    ? {
          [ConditionName in SprinkleConditionsNames<
              SprinklesFn["conditions"]
          >[number] as `_${ConditionName}`]?: ConditionPropsByName<SprinklesFn, ConditionName>;
      }
    : never;

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
