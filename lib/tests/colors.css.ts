import { createSprinkles, defineProperties } from "@vanilla-extract/sprinkles";
import { colorPalette } from "./colors-palette";

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
        color: colorPalette,
        background: colorPalette,
        backgroundColor: colorPalette,
        borderColor: colorPalette,
        borderTopColor: colorPalette,
        borderBottomColor: colorPalette,
        borderLeftColor: colorPalette,
        borderRightColor: colorPalette,
        outlineColor: colorPalette,
    },
    shorthands: {
        bg: ["background"],
        bgColor: ["backgroundColor"],
        borderXColor: ["borderLeftColor", "borderRightColor"],
    },
});

export const colorSprinkles = createSprinkles(colorProps);
export type ColorSprinkles = Parameters<typeof colorSprinkles>[0];
