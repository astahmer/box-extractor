import { assignVars, createThemeContract, globalStyle } from "@vanilla-extract/css";
import { tokens } from "@box-extractor/vanilla-theme";

// 0c2461
/* #60a3bc */
/* #4AC1A2 */

const extraColors = {
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
    azraqblue: {
        "50": "#cdd5ed",
        "100": "#a7b6df",
        "200": "#95a7d8",
        "300": "#8297d1",
        "400": "#6f88cb",
        "500": "#4a69bd",
        "600": "#39539b",
        "700": "#324989",
        "800": "#2b3f76",
        "900": "#1d2b51",
    },
};
export const flatPrimaryColors = {
    "frenchblue.50": extraColors.frenchblue["50"],
    "frenchblue.100": extraColors.frenchblue["100"],
    "frenchblue.200": extraColors.frenchblue["200"],
    "frenchblue.300": extraColors.frenchblue["300"],
    "frenchblue.400": extraColors.frenchblue["400"],
    "frenchblue.500": extraColors.frenchblue["500"],
    "frenchblue.600": extraColors.frenchblue["600"],
    "frenchblue.700": extraColors.frenchblue["700"],
    "frenchblue.800": extraColors.frenchblue["800"],
    "frenchblue.900": extraColors.frenchblue["900"],
    "brand.50": extraColors.azraqblue["50"],
    "brand.100": extraColors.azraqblue["100"],
    "brand.200": extraColors.azraqblue["200"],
    "brand.300": extraColors.azraqblue["300"],
    "brand.400": extraColors.azraqblue["400"],
    "brand.500": extraColors.azraqblue["500"],
    "brand.600": extraColors.azraqblue["600"],
    "brand.700": extraColors.azraqblue["700"],
    "brand.800": extraColors.azraqblue["800"],
    "brand.900": extraColors.azraqblue["900"],
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

const primary = extraColors.azraqblue;

const lightVars = assignVars(colorModeVars, {
    color: {
        mainBg: primary["200"],
        secondaryBg: primary["300"],
        text: tokens.colors.blue["400"],
        bg: primary["600"],
        bgSecondary: primary["400"],
        bgHover: primary["100"],
    },
});

const darkVars = assignVars(colorModeVars, {
    color: {
        mainBg: primary["600"],
        secondaryBg: primary["700"],
        text: tokens.colors.blue["300"],
        bg: primary["300"],
        bgSecondary: primary["800"],
        bgHover: primary["700"],
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

globalStyle("a.active", { backgroundColor: primary[800], color: tokens.colors.whiteAlpha[700] });
