import type { PropsWithChildren } from "react";
import { ThemeSprinkles, themeSprinkles } from "../theme/sprinkles.css";

export const Box = ({ children, ...props }: BoxProps) => {
    const className = themeSprinkles(props);
    return <div className={className} children={children} />;
};

export type BoxProps = PropsWithChildren<ThemeSprinkles>;
