import type { PropsWithChildren } from "react";
import { getBoxProps } from "@box-extractor/vanilla-extract";
import { ThemeSprinkles, themeSprinkles } from "@box-extractor/vanilla-theme/css";
import type { EscapeHatchProps, ReversedConditionsProps } from "@box-extractor/vanilla-theme";

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
