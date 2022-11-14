import { Children, ReactNode } from "react";
import type { BoxProps } from "./DessertBox";
import { DessertBox } from "./DessertBox";

export const Flex = (props: BoxProps) => <DessertBox display="flex" {...props} />;
export const VFlex = (props: BoxProps) => <DessertBox display="flex" flexDirection="column" {...props} />;

type StackProps = Omit<BoxProps, "align"> & {
    children: ReactNode;
    space?: BoxProps["paddingBottom"];
};
// https://github.com/vanilla-extract-css/vanilla-extract/blob/98f8b0387d661b77705d2cd83ab3095434e1223e/site/src/system/Stack/Stack.tsx#L32
export const Stack = ({ children, space = 4, ...props }: StackProps) => {
    const stackItems = Children.toArray(children);
    const direction = props["flexDirection"] ?? "column";

    return (
        <DessertBox display="flex" flexDirection={direction} {...props}>
            {stackItems.map((item, index) => (
                <DessertBox
                    key={index}
                    __pr={direction === "row" ? (index !== stackItems.length - 1 ? space : undefined) : undefined}
                    __pb={direction === "column" ? (index !== stackItems.length - 1 ? space : undefined) : undefined}
                >
                    {item}
                </DessertBox>
            ))}
        </DessertBox>
    );
};

export const HStack = (props: StackProps) => <Stack flexDirection="row" {...props} />;

export const Center = (props: BoxProps) => (
    <Flex justifyContent="center" alignItems="center" textAlign="center" {...props} />
);
