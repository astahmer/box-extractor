import { colors } from "./color-palette";

// https://github.com/chakra-ui/chakra-ui/blob/05b19899b02e17b4ee16045c9e5065fa835f0159/packages/components/theme/src/foundations/typography.ts#L1-L64
const typography = {
    letterSpacings: {
        tighter: "-0.05em",
        tight: "-0.025em",
        normal: "0",
        wide: "0.025em",
        wider: "0.05em",
        widest: "0.1em",
    },

    lineHeights: {
        normal: "normal",
        none: "1",
        shorter: "1.25",
        short: "1.375",
        base: "1.5",
        tall: "1.625",
        taller: "2",
        "3": ".75rem",
        "4": "1rem",
        "5": "1.25rem",
        "6": "1.5rem",
        "7": "1.75rem",
        "8": "2rem",
        "9": "2.25rem",
        "10": "2.5rem",
    },

    fontWeights: {
        hairline: "100",
        thin: "200",
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
        black: "900",
    },

    fonts: {
        heading:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
        body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
        mono: 'SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
    },

    fontSizes: {
        "3xs": "0.45rem",
        "2xs": "0.625rem",
        xs: "0.75rem",
        sm: "0.875rem",
        md: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
        "5xl": "3rem",
        "6xl": "3.75rem",
        "7xl": "4.5rem",
        "8xl": "6rem",
        "9xl": "8rem",
    },
};

// https://github.com/chakra-ui/chakra-ui/blob/05b19899b02e17b4ee16045c9e5065fa835f0159/packages/components/theme/src/foundations/z-index.ts#L1-L15
const zIndices = {
    hide: "-1",
    auto: "auto",
    base: "0",
    docked: "10",
    dropdown: "1000",
    sticky: "1100",
    banner: "1200",
    overlay: "1300",
    modal: "1400",
    popover: "1500",
    skipLink: "1600",
    toast: "1700",
    tooltip: "1800",
};

// https://github.com/chakra-ui/chakra-ui/blob/05b19899b02e17b4ee16045c9e5065fa835f0159/packages/components/theme/src/foundations/shadows.ts#L17
const shadows = {
    xs: "0 0 0 1px rgba(0, 0, 0, 0.05)",
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    outline: "0 0 0 3px rgba(66, 153, 225, 0.6)",
    inner: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
    none: "none",
    "dark-lg": "rgba(0, 0, 0, 0.1) 0px 0px 0px 1px, rgba(0, 0, 0, 0.2) 0px 5px 10px, rgba(0, 0, 0, 0.4) 0px 15px 40px",
};

// https://github.com/chakra-ui/chakra-ui/blob/05b19899b02e17b4ee16045c9e5065fa835f0159/packages/components/theme/src/foundations/spacing.ts#L22
const space = {
    auto: "auto",
    none: "none",
    px: "1px",
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    2.5: "0.625rem",
    3: "0.75rem",
    3.5: "0.875rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    7: "1.75rem",
    8: "2rem",
    9: "2.25rem",
    10: "2.5rem",
    12: "3rem",
    14: "3.5rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    28: "7rem",
    32: "8rem",
    36: "9rem",
    40: "10rem",
    44: "11rem",
    48: "12rem",
    52: "13rem",
    56: "14rem",
    60: "15rem",
    64: "16rem",
    72: "18rem",
    80: "20rem",
    96: "24rem",
} as const;

// https://github.com/chakra-ui/chakra-ui/blob/05b19899b02e17b4ee16045c9e5065fa835f0159/packages/components/theme/src/foundations/borders.ts#L1-L7
const borders = {
    none: "0",
    "1px": "1px solid",
    "2px": "2px solid",
    "4px": "4px solid",
    "8px": "8px solid",
};

// https://github.com/chakra-ui/chakra-ui/blob/05b19899b02e17b4ee16045c9e5065fa835f0159/packages/components/theme/src/foundations/radius.ts#L1-L12
const radii = {
    none: "0",
    sm: "0.125rem",
    base: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
};

// https://github.com/chakra-ui/chakra-ui/blob/05b19899b02e17b4ee16045c9e5065fa835f0159/packages/components/theme/src/foundations/sizes.ts#L3-L36
const largeSizes = {
    max: "max-content",
    min: "min-content",
    full: "100%",
    "3xs": "14rem",
    "2xs": "16rem",
    xs: "20rem",
    sm: "24rem",
    md: "28rem",
    lg: "32rem",
    xl: "36rem",
    "2xl": "42rem",
    "3xl": "48rem",
    "4xl": "56rem",
    "5xl": "64rem",
    "6xl": "72rem",
    "7xl": "80rem",
    "8xl": "90rem",
    prose: "60ch",
};

const container = {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
};

const percentsRecord = {
    auto: "auto",
    "0%": "0%",
    "25%": "25%",
    "50%": "50%",
    "75%": "75%",
    "100%": "100%",
    "100vh": "100vh",
    "100vw": "100vw",
};

const positions = {
    auto: "auto",
    "0": "0",
    "-50%": "-50%",
    "0%": "0%",
    "50%": "50%",
    "100%": "100%",
};

const aligns = {
    stretch: "stretch",
    start: "flex-start",
    center: "center",
    end: "flex-end",
    baseline: "baseline",
    "space-around": "space-around",
    "space-between": "space-between",
    "space-evenly": "space-evenly",
};

const sizes = {
    ...space,
    ...largeSizes,
    ...percentsRecord,
};

export const tokens = {
    colors,
    space,
    // breakpoints,
    container,
    borders,
    radii,
    sizes,
    typography,
    zIndices,
    shadows,
    positions,
    aligns,
};
