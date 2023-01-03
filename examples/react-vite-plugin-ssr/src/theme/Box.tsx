import type { PropsWithChildren } from "react";
import { composeClassNames, getBoxProps } from "@box-extractor/vanilla-extract";
import { ThemeSprinkles, themeSprinkles } from "@box-extractor/vanilla-theme/css";
import type { EscapeHatchProps, ReversedConditionsProps } from "@box-extractor/vanilla-theme";

const defaultElement = "div";

export const Box = <TType extends React.ElementType = typeof defaultElement>({
    children,
    as,
    className,
    style,
    ...props
}: PolymorphicComponentProps<PropsWithChildren<BoxProps>, TType>) => {
    const Component = as ?? defaultElement;
    const boxProps = getBoxProps(props, themeSprinkles);

    return (
        <Component
            {...boxProps.otherProps}
            className={composeClassNames(className, themeSprinkles(boxProps.sprinklesProps))}
            children={children}
            style={boxProps.sprinklesEscapeHatchProps}
        />
    );
};

export type BoxProps = ThemeSprinkles &
    EscapeHatchProps<ThemeSprinkles> &
    ReversedConditionsProps<typeof themeSprinkles>;

export type AsProp<TType extends React.ElementType = React.ElementType> = {
    as?: TType;
};

export type PolymorphicComponentProps<Props, TType extends React.ElementType> = Props &
    AsProp<TType> &
    Omit<React.ComponentProps<TType>, keyof AsProp | keyof Props>;
