import { createTheme, createThemeContract } from "@vanilla-extract/css";
import { vars } from "./vars";

const colorModeVars = createThemeContract({
    color: {
        primary: null,
        secondary: null,
    },
});

const lightMode = createTheme(colorModeVars, {
    color: {
        primary: vars.colors.red["600"],
        secondary: vars.colors.pink["600"],
    },
});

const darkMode = createTheme(colorModeVars, {
    color: {
        primary: vars.colors.blue["300"],
        secondary: vars.colors.pink["300"],
    },
});

export const colorMode = {
    light: lightMode,
    dark: darkMode,
    vars: colorModeVars,
    localStorageKey: "astahmer.dev-color-mode",
};
