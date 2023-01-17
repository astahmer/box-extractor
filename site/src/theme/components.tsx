import { Children, PropsWithChildren, ReactNode } from "react";
import type { BoxProps, PolymorphicComponentProps } from "./Box";
import { Box } from "./Box";

type StackProps = Omit<BoxProps, "align"> & {
    children: ReactNode;
    spacing?: BoxProps["paddingBottom"];
};
const defaultElement = "div";

// https://github.com/vanilla-extract-css/vanilla-extract/blob/98f8b0387d661b77705d2cd83ab3095434e1223e/site/src/system/Stack/Stack.tsx#L32
export const Stack = <TType extends React.ElementType = typeof defaultElement>(
    props: PolymorphicComponentProps<StackProps, TType>
) => {
    const { children, as, spacing, ...rest } = props;
    const stackItems = Children.toArray(children);
    const direction = props.flexDirection ?? "column";

    return (
        <Box display="flex" flexDirection={direction} {...rest}>
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

export const Flex = (props: PropsWithChildren<BoxProps>) => <Box flexDirection="row" {...props} />;
export const Inline = (props: PropsWithChildren<StackProps>) => <Stack flexDirection="row" {...props} />;

export const Center = (props: PropsWithChildren<BoxProps>) => (
    <Box display="flex" justifyContent="center" alignItems="center" textAlign="center" {...props} />
);
