import { Children, ReactNode } from "react";
import type { BoxProps, PolymorphicComponentProps } from "./Box";
import { Box } from "./Box";

type StackProps = Omit<BoxProps, "align"> & {
    children: ReactNode;
    direction?: BoxProps["flexDirection"];
    spacing?: BoxProps["paddingBottom"];
};
const defaultElement = "div";

// https://github.com/vanilla-extract-css/vanilla-extract/blob/98f8b0387d661b77705d2cd83ab3095434e1223e/site/src/system/Stack/Stack.tsx#L32
export const Stack = <TType extends React.ElementType = typeof defaultElement>(
    props: PolymorphicComponentProps<StackProps, TType>
) => {
    const { children, as: Component, spacing, ...rest } = props;
    const stackItems = Children.toArray(children);
    const direction = props.direction ?? "column";

    return (
        <Box as={Component as any} display="flex" flexDirection={direction} {...rest}>
            {stackItems.map((item, index) => (
                <Box
                    key={index}
                    paddingRight={
                        direction === "row" ? (index !== stackItems.length - 1 ? spacing : undefined) : undefined
                    }
                    paddingBottom={
                        direction === "column" ? (index !== stackItems.length - 1 ? spacing : undefined) : undefined
                    }
                >
                    {item}
                </Box>
            ))}
        </Box>
    );
};

export const Inline = (props: StackProps) => <Stack flexDirection="row" {...props} />;

export const Center = (props: BoxProps) => (
    <Box justifyContent="center" alignItems="center" textAlign="center" {...props} />
);
