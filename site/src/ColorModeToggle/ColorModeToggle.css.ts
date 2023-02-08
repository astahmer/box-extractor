import { tokens } from "@box-extractor/vanilla-theme";
import { createVar, style } from "@vanilla-extract/css";
import { darkMode } from "../theme/color-mode";

// adapted from https://github.com/astahmer/vanilla-extract/blob/dab0f257c10cdf3aec9a220dbf6191281ada0831/site/src/ColorModeToggle/ColorModeToggle.tsx#L9

const toggleBrightness = createVar();
const toggleContent = createVar();
const focusRingColor = createVar();

export const ColorModeButtonStyle = style({
    outline: "none",
    fontSize: 24,
    height: 42,
    width: 42,
    vars: {
        [toggleBrightness]: "0",
        [toggleContent]: '"☀️"',
        [focusRingColor]: tokens.colors.pink[400],
    },
    ":focus-visible": {
        boxShadow: `0px 0px 0px 3px ${focusRingColor}`,
    },
    "::before": {
        content: toggleContent,
        filter: `contrast(0) brightness(${toggleBrightness})`,
    },
    selectors: {
        [`.${darkMode} &`]: {
            vars: {
                [toggleBrightness]: "10",
                [toggleContent]: '"🌙"',
                [focusRingColor]: tokens.colors.pink[500],
            },
        },
    },
});
