import { assignVars, createThemeContract, globalStyle } from "@vanilla-extract/css";
import { tokens } from "@box-extractor/vanilla-theme";

/* #60a3bc */
/* #4AC1A2 */

const colors = {
    frenchblue: {
        50: "#F7FAFC",
        100: "#EFF6F8",
        200: "#D7E8EE",
        300: "#BFDAE4",
        400: "#90BFD0",
        500: "#60A3BC",
        600: "#5693A9",
        700: "#3A6271",
        800: "#2B4955",
        900: "#1D3138",
    },
};

export const colorModeVars = createThemeContract({
    color: {
        mainBg: null,
        secondaryBg: null,
        text: null,
        bg: null,
        bgSecondary: null,
        bgHover: null,
    },
});

const lightVars = assignVars(colorModeVars, {
    color: {
        mainBg: tokens.colors.cyan["300"],
        secondaryBg: tokens.colors.cyan["400"],
        text: tokens.colors.red["600"],
        bg: tokens.colors.cyan["600"],
        bgSecondary: tokens.colors.cyan["200"],
        bgHover: tokens.colors.cyan["100"],
    },
});

const darkVars = assignVars(colorModeVars, {
    color: {
        mainBg: tokens.colors.cyan["900"],
        secondaryBg: tokens.colors.cyan["800"],
        text: tokens.colors.blue["300"],
        bg: tokens.colors.cyan["300"],
        bgSecondary: tokens.colors.cyan["800"],
        bgHover: tokens.colors.cyan["700"],
    },
});

export const lightMode = "light";
export const darkMode = "dark";

globalStyle("body", {
    background: `linear-gradient(to bottom, ${colorModeVars.color.mainBg} 20%, ${colorModeVars.color.secondaryBg})`,
    backgroundAttachment: "fixed",
    color: colorModeVars.color.text,
});

globalStyle(`.${lightMode}`, { colorScheme: "light", vars: lightVars });
globalStyle(`.${darkMode}`, { colorScheme: "dark", vars: darkVars });

globalStyle("a.active", { color: colorModeVars.color.bg });
