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
        mainBg: colors.frenchblue["300"],
        secondaryBg: colors.frenchblue["400"],
        text: tokens.colors.red["600"],
        bg: colors.frenchblue["600"],
        bgSecondary: colors.frenchblue["200"],
        bgHover: colors.frenchblue["100"],
    },
});

const darkVars = assignVars(colorModeVars, {
    color: {
        mainBg: colors.frenchblue["900"],
        secondaryBg: colors.frenchblue["800"],
        text: tokens.colors.blue["300"],
        bg: colors.frenchblue["300"],
        bgSecondary: colors.frenchblue["800"],
        bgHover: colors.frenchblue["700"],
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
