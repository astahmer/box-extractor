import { style } from "@vanilla-extract/css";

export const switchThumb = style({
    width: "21px",
    height: "21px",
    transform: "translateX(2px)",
    willChange: "transform",
    transition: "transform 100ms ease 0s",
    selectors: {
        "&[data-pressed]": {
            transform: "translateX(19px)",
        },
    },
});
