import { tokens } from "@box-extractor/vanilla-theme";
import { assignVars, createThemeContract, globalStyle } from "@vanilla-extract/css";
import { darkThemeVars, lightThemeVars, primary } from "../theme";

// 0c2461
/* #60a3bc */
/* #4AC1A2 */

export const lightMode = "light";
export const darkMode = "dark";

globalStyle("body", {
    background: `linear-gradient(to bottom, ${lightThemeVars.color.mainBg} 20%, ${lightThemeVars.color.secondaryBg})`,
    backgroundAttachment: "fixed",
    color: lightThemeVars.color.text,
});

// console.log({ lightThemeVars, darkThemeVars });

globalStyle(`.${lightMode}`, { colorScheme: "light", vars: assignVars(lightThemeVars, lightThemeVars) });
globalStyle(`.${darkMode}`, { colorScheme: "dark", vars: assignVars(darkThemeVars, darkThemeVars) });

globalStyle("a.active", { backgroundColor: primary[800], color: tokens.colors.whiteAlpha[700] });
