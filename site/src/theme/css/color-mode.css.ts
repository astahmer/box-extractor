import { tokens } from "@box-extractor/vanilla-theme";
import { assignVars, createThemeContract, globalStyle } from "@vanilla-extract/css";
import { primary } from "../primary";

export const colorModeVars = createThemeContract({
    color: {
        mainBg: "",
        secondaryBg: "",
        text: "",
        bg: "",
        bgSecondary: "",
        bgHover: "",
    },
});

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

// console.log({ colorModeVars, darkThemeVars });

globalStyle(`.${lightMode}`, { colorScheme: "light", vars: lightVars });
globalStyle(`.${darkMode}`, { colorScheme: "dark", vars: darkVars });

globalStyle("a.active", { backgroundColor: primary[800], color: tokens.colors.whiteAlpha[700] });
