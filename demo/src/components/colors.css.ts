import { createSprinkles, defineProperties } from "@vanilla-extract/sprinkles";
import { flatColors } from "../theme/colors.css";

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
        color: flatColors,
        background: flatColors,
        backgroundColor: flatColors,
        borderColor: flatColors,
        borderTopColor: flatColors,
        borderBottomColor: flatColors,
        borderLeftColor: flatColors,
        borderRightColor: flatColors,
        outlineColor: flatColors,
    },
    shorthands: {
        bg: ["background"],
        bgColor: ["backgroundColor"],
        borderXColor: ["borderLeftColor", "borderRightColor"],
    },
});

export const colorSprinkes = createSprinkles(colorProps);
export type ColorSprinkes = Parameters<typeof colorSprinkes>[0];
