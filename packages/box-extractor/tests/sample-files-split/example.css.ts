import { createSprinkles, defineProperties } from "@vanilla-extract/sprinkles";
import { flatColors } from "./flat-colors";

const colors = { ...flatColors, main: "#d2a8ff", secondary: "#7ee787" };
const breakpoins = { mobile: "320px", tablet: "768px", desktop: "1024px" };
const breakpointToCondition = (name: string, minWidth: string) => ({
    [name]: { "@media": `(min-width: ${minWidth})` },
});

const base = defineProperties({
    conditions: {
        ...Object.entries(breakpoins).reduce(
            (acc, [name, minWidth]) => ({ ...acc, ...breakpointToCondition(name, minWidth) }),
            {}
        ),
        idle: {},
        focus: { selector: "&:focus" },
        hover: { selector: "&:hover" },
    },
    defaultCondition: "idle",
    properties: {
        position: ["relative", "absolute"],
        display: ["block", "inline-block", "flex", "inline-flex"],
        color: {
            ...colors,
            brand: "red",
            other: "blue",
        },
    },
    shorthands: {
        p: ["position"],
        d: ["display"],
    },
});

export const exampleSprinkles = createSprinkles(base);
export type ExampleSprinkles = Parameters<typeof exampleSprinkles>[0];
