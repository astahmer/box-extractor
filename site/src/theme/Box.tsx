import { composeClassNames, getBoxProps } from "@box-extractor/vanilla-extract";
import type { EscapeHatchProps, ReversedConditionsProps } from "@box-extractor/vanilla-theme";
import { ComponentWithAs, polymorphicFactory } from "@polymorphic-factory/react";
import type { ElementType, PropsWithChildren } from "react";
import { ThemeSprinkles, themeSprinkles } from "./css";

const defaultElement = "div";

type PolymorphFactory<P extends Record<string, unknown> = Record<never, never>> = <
    T extends ElementType,
    Options = never
>(
    component: T,
    option?: Options
) => ComponentWithAs<T, P>;

type DOMElements = keyof JSX.IntrinsicElements;
type HTMLPolymorphicComponents<Props extends Record<string, unknown> = Record<never, never>> = {
    [Tag in DOMElements]: ComponentWithAs<Tag, Props>;
};

export const box = polymorphicFactory({
    styled: (component, _options) => (props) => {
        const boxProps = getBoxProps(props, themeSprinkles);
        const Component = props.as ?? component;

        return (
            <Component
                {...boxProps.otherProps}
                className={composeClassNames(
                    (props["className"] as string) ?? "",
                    themeSprinkles(boxProps.sprinklesProps)
                )}
                style={boxProps.sprinklesEscapeHatchProps}
            />
        );
    },
}) as PolymorphFactory<BoxProps> & HTMLPolymorphicComponents<BoxProps>;

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

export type BoxProps = {
    [P in keyof ThemeSprinkles]?: ThemeSprinkles[P] | undefined;
} & EscapeHatchProps<ThemeSprinkles> &
    ReversedConditionsProps<typeof themeSprinkles>;

export type AsProp<TType extends React.ElementType = React.ElementType> = {
    as?: TType;
};

export type PolymorphicComponentProps<Props, TType extends React.ElementType> = Props &
    AsProp<TType> &
    Omit<React.ComponentProps<TType>, keyof AsProp | keyof Props>;
