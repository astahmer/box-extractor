import type { WithStyledProps } from "@box-extractor/vanilla-wind";
import { Children, PropsWithChildren, ReactNode } from "react";
import type { PolymorphicComponentProps } from "./Box";
import { Box } from "./Box";
import type { css } from "./theme";

type StackProps = Omit<WithStyledProps<typeof css>, "align"> & {
    children: ReactNode;
    spacing?: WithStyledProps<typeof css>["paddingBottom"];
};
const defaultElement = "div";

// https://github.com/vanilla-extract-css/vanilla-extract/blob/98f8b0387d661b77705d2cd83ab3095434e1223e/site/src/system/Stack/Stack.tsx#L32
export const Stack = <TType extends React.ElementType = typeof defaultElement>(
    props: PolymorphicComponentProps<StackProps, TType>
) => {
    const { children, as, _styled, spacing, ...rest } = props;
    const stackItems = Children.toArray(children);
    const direction = props.flexDirection ?? "column";

    return (
        <Box display="flex" flexDirection={direction} {...rest} className={_styled as any}>
            {stackItems.map((item, index) => (
                <Box
                    key={index}
                    pr={direction === "row" ? (index !== stackItems.length - 1 ? spacing ?? "0" : "0") : "0"}
                    pb={direction === "column" ? (index !== stackItems.length - 1 ? spacing ?? "0" : "0") : "0"}
                >
                    {item}
                </Box>
            ))}
        </Box>
    );
};

export const Center = (props: PropsWithChildren) => (
    <Box display="flex" justifyContent="center" alignItems="center" textAlign="center" {...props} />
);
