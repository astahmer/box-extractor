import { createSprinkles, defineProperties } from "@vanilla-extract/sprinkles";

const base = defineProperties({
    conditions: {
        idle: {},
        focus: { selector: "&:focus" },
        hover: { selector: "&:hover" },
    },
    defaultCondition: "idle",
    properties: {
        position: ["relative", "absolute"],
        display: ["block", "inline-block", "flex", "inline-flex"],
        color: {
            // brand: vars.color.brand,
            brand: "red",
            other: "blue",
        },
        backgroundColor: {
            main: "green",
            secondary: "blue",
            third: "pink",
        },
    },
    shorthands: {
        p: ["position"],
        d: ["display"],
    },
});

const makeResponsive = (min: number, max: number) => ({
    "@media": ["screen", min ? `(min-width: ${min})` : "", max ? `(max-width: ${max})` : ""]
        .filter(Boolean)
        .join(" and "),
});

// const responsive = defineProperties({
//     conditions: {
//         default: {},
//         mobile: makeResponsive(0, 767),
//         tablet: makeResponsive(768, 1023),
//         desktop: makeResponsive(1024, 1439),
//     },
//     defaultCondition: "mobile",
//     properties: {
//         display: ["block", "inline-block", "flex", "inline-flex"],
//         position: ["relative", "absolute"],
//         color: {
//             // brand: vars.color.brand,
//             brand: "red",
//             other: "blue",
//         },
//         backgroundColor: {
//             main: "green",
//             secondary: "brown",
//         },
//     },
//     shorthands: {
//         p: ["position"],
//         d: ["display"],
//     },
// });

export const minimalSprinkles = createSprinkles(base);
export type MinimalSprinkles = Parameters<typeof minimalSprinkles>[0];
