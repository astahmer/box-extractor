import { tw } from "./theme";

const className = tw({
    p: 24,
    rounded: "lg",
    bg: "blue.500",
    display: { dark: { hover: "table-footer-group" } },
    hover: {
        bg: "whitesmoke",
        borderColor: undefined,
        borderRadius: "2xl",
        color: "xxx".startsWith("xxx") ? "darkseagreen" : "red.200",
        w: "falsy".startsWith("xxx") ? "1/2" : "12px",
        padding: Math.random() > 0.5 ? "100px" : "4",
        d: { dark: { large: "flex" } },
        display: { light: "inline-flex" },
        backgroundColor: {
            dark: "blue.700",
            light: { large: "red.200", dark: "ThreeDHighlight" },
        },
    },
    dark: {
        p: 24,
        borderColor: "whitesmoke",
        bg: "red.800",
        hover: {
            color: "blue.600",
            d: {
                light: "flex",
                large: { small: "contents" },
            },
        },
    },
});
