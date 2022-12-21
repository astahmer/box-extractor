import { createSprinkles, defineProperties } from "@vanilla-extract/sprinkles";

const base = defineProperties({
    conditions: {
        idle: {},
        focus: { selector: "&:focus" },
        hover: { selector: "&:hover" },
    },
    defaultCondition: "idle",
    properties: {
        position: ["relative", "absolute"],
        display: ["block", "inline-block", "flex", "inline-flex"],
        color: {
            brand: "red",
            other: "blue",
        },
        backgroundColor: {
            main: "green",
            secondary: "blue",
            third: "pink",
        },
    },
    shorthands: {
        p: ["position"],
        d: ["display"],
    },
});

export const externalSprinkles = createSprinkles(base);
export type ExternalSprinkles = Parameters<typeof externalSprinkles>[0];
