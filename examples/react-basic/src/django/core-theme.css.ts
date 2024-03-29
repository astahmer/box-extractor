import { createTheme } from "@box-extractor/vanilla-wind";

export const [coreThemeClass, coreThemeVars] = createTheme({
    space: {
        none: "0",
        px: "1px",
        xsm: "2px",
        small: "2px",
        sm: "4px",
        md: "8px",
        lg: "16px",
        xl: "24px",
        xxl: "32px",
        xxxl: "48px",
        xxxxl: "64px",
    },
    size: {
        none: "0",
        px: "1px",
        "1/2": "50%",
        "1/3": "33.333333%",
        "2/3": "66.666667%",
        "1/4": "25%",
        "2/4": "50%",
        "3/4": "75%",
        "1/5": "20%",
        "2/5": "40%",
        "3/5": "60%",
        "4/5": "80%",
        "1/6": "16.666667%",
        full: "100%",
    },
    transition: {
        fast: "0.1s ease-in-out",
        slow: "0.3s ease-in-out",
    },
    backgroundColor: {
        error: "#fae7e7",
        warning: "#fff3cd",
    },
    color: {
        white: "#fff",
        black: "#000",
        error: "#d02e2e",
        warning: "#856404",
    },
});
