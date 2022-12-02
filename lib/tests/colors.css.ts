import { createSprinkles, defineProperties } from "@vanilla-extract/sprinkles";
import { flatColorsMap } from "./colors-palette";

const colorProps = defineProperties({
    // conditions: {
    //     default: {},
    //     lightMode: { "@media": "(prefers-color-scheme: light)" },
    //     darkMode: { "@media": "(prefers-color-scheme: dark)" },
    //     focus: { selector: "&:focus" },
    //     hover: { selector: "&:hover" },
    // },
    // defaultCondition: "default",
    properties: {
        color: flatColorsMap,
        background: flatColorsMap,
        backgroundColor: flatColorsMap,
        borderColor: flatColorsMap,
        borderTopColor: flatColorsMap,
        borderBottomColor: flatColorsMap,
        borderLeftColor: flatColorsMap,
        borderRightColor: flatColorsMap,
        outlineColor: flatColorsMap,
    },
    shorthands: {
        bg: ["background"],
        bgColor: ["backgroundColor"],
        borderXColor: ["borderLeftColor", "borderRightColor"],
    },
});

export const colorSprinkles = createSprinkles(colorProps);
export type ColorSprinkes = Parameters<typeof colorSprinkles>[0];
