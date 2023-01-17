import { createTheme, createThemeContract } from "@vanilla-extract/css";
import { tokens } from "@box-extractor/vanilla-theme";

export const colorModeVars = createThemeContract({
    color: {
        primary: null,
        secondary: null,
    },
});

export const lightMode = createTheme(colorModeVars, {
    color: {
        primary: tokens.colors.red["600"],
        secondary: tokens.colors.pink["600"],
    },
});

export const darkMode = createTheme(colorModeVars, {
    color: {
        primary: tokens.colors.blue["300"],
        secondary: tokens.colors.pink["300"],
    },
});
