import { flatColors, tokens } from "@box-extractor/vanilla-theme";
import { ConfigConditions, createTheme, defineProperties } from "@box-extractor/vanilla-wind";

const space = tokens.space as Record<keyof typeof tokens.space | `${keyof typeof tokens.space}`, string>;
const sizes = tokens.sizes as Record<keyof typeof tokens.sizes | `${keyof typeof tokens.sizes}`, string>;

/** azraqblue */
export const primary = {
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
} as const;

export const lightThemeVars = createTheme("contract", {
    color: {
        mainBg: primary["200"],
        secondaryBg: primary["300"],
        text: tokens.colors.blue["400"],
        bg: primary["600"],
        bgSecondary: primary["400"],
        bgHover: primary["100"],
    },
});

export const [darkClassName, darkThemeVars] = createTheme({
    color: {
        mainBg: primary["600"],
        secondaryBg: primary["700"],
        text: tokens.colors.blue["300"],
        bg: primary["300"],
        bgSecondary: primary["800"],
        bgHover: primary["700"],
    },
});
console.log({ lightThemeVars, darkClassName, darkThemeVars });

const flatPrimaryColors = {
    "brand.50": primary["50"],
    "brand.100": primary["100"],
    "brand.200": primary["200"],
    "brand.300": primary["300"],
    "brand.400": primary["400"],
    "brand.500": primary["500"],
    "brand.600": primary["600"],
    "brand.700": primary["700"],
    "brand.800": primary["800"],
    "brand.900": primary["900"],
};

const colors = { ...flatColors, ...lightThemeVars.color, ...flatPrimaryColors };

const screens = {
    mobile: { max: "599px" },
    tablet: { min: "600px", max: "1023px" },
    desktop: { min: "1024px" },
} as const;
type TwResponsiveBreakpoints = keyof typeof screens;
type TwResponsiveBreakpointsMap = Record<TwResponsiveBreakpoints, { min?: string; max?: string }>;

const twBreakpointsToAppBreakpoints = (breakpointsMap: TwResponsiveBreakpointsMap) =>
    Object.fromEntries(
        Object.entries(breakpointsMap).map(([key, { min, max }]) => [
            key,
            {
                "@media": ["screen", min ? `(min-width: ${min})` : "", max ? `(max-width: ${max})` : ""]
                    .filter(Boolean)
                    .join(" and "),
            },
        ])
    ) as Record<TwResponsiveBreakpoints, ConfigConditions[string]>;

export const css = defineProperties({
    conditions: {
        ...twBreakpointsToAppBreakpoints(screens),
        default: {},
        hover: { selector: "&:hover,&[data-hover]" },
        active: { selector: "&:active,&[data-active]" },
        focus: { selector: "&:focus,&[data-focus]" },
        highlighted: { selector: "&[data-highlighted]" },
        focusWithin: { selector: "&:focus-within" },
        focusVisible: { selector: "&:focus-visible" },
        disabled: {
            selector: "&[disabled],&[aria-disabled=true],&[data-disabled]",
        },
        readOnly: {
            selector: "&[aria-readonly=true],&[readonly],&[data-readonly]",
        },
        before: { selector: "&::before" },
        after: { selector: "&::after" },
        empty: { selector: "&:empty" },
        expanded: { selector: "&[aria-expanded=true]" },
        checked: { selector: "&[aria-checked=true],&[data-checked]" },
        grabbed: { selector: "&[aria-grabbed=true],&[data-grabbed]" },
        pressed: { selector: "&[aria-pressed=true],&[data-pressed]" },
        invalid: { selector: "&[aria-invalid=true],&[data-invalid]" },
        valid: { selector: "&[aria-invalid=false],&[data-valid]" },
        loading: { selector: "&[aria-busy=true],&[data-loading]" },
        selected: { selector: "&[aria-selected=true],&[data-selected]" },
        hidden: { selector: "&[aria-hidden=true],&[data-hidden]" },
        autofill: { selector: "&:-webkit-autofill" },
        even: { selector: "&:nth-of-type(even)" },
        odd: { selector: "&:nth-of-type(odd)" },
        first: { selector: "&:first-of-type" },
        last: { selector: "&:last-of-type" },
        notFirst: { selector: "&:not(:first-of-type)" },
        notLast: { selector: "&:not(:last-of-type)" },
        visited: { selector: "&:visited" },
        activeLink: { selector: "&[aria-current=page]" },
        activeStep: { selector: "&[aria-current=step]" },
        indeterminate: {
            selector: "&:indeterminate,&[aria-checked=mixed],&[data-indeterminate]",
        },
        groupHover: {
            selector:
                "[role=group]:hover &,[role=group][data-hover] &,[data-group]:hover &,[data-group][data-hover] &,.group:hover &,.group[data-hover] &",
        },
        peerHover: {
            selector: "[data-peer]:hover ~ &, [data-peer][data-hover] ~ &, .peer:hover ~ &, .peer[data-hover] ~ &",
        },
        groupFocus: {
            selector:
                "[role=group]:focus &,[role=group][data-focus] &,[data-group]:focus &,[data-group][data-focus] &,.group:focus &,.group[data-focus] &",
        },
        peerFocus: {
            selector: "[data-peer]:focus ~ &, [data-peer][data-focus] ~ &, .peer:focus ~ &, .peer[data-focus] ~ &",
        },
        groupFocusVisible: {
            selector: "&[role=group]:focus-visible[data-group]:focus-visible.group:focus-visible",
        },
        peerFocusVisible: {
            selector: "[data-peer]:focus-visible ~ &, .peer:focus-visible ~ &",
        },
        groupActive: {
            selector:
                "[role=group]:active &,[role=group][data-active] &,[data-group]:active &,[data-group][data-active] &,.group:active &,.group[data-active] &",
        },
        peerActive: {
            selector: "[data-peer]:active ~ &, [data-peer][data-active] ~ &, .peer:active ~ &, .peer[data-active] ~ &",
        },
        groupDisabled: {
            selector:
                "[role=group]:disabled &,[role=group][data-disabled] &,[data-group]:disabled &,[data-group][data-disabled] &,.group:disabled &,.group[data-disabled] &",
        },
        peerDisabled: {
            selector:
                "&[data-peer]:disabled ~ &,[data-peer][data-disabled] ~ &,.peer:disabled ~ &,.peer[data-disabled] ~ &",
        },
        groupInvalid: {
            selector:
                "[role=group]:invalid &,[role=group][data-invalid] &,[data-group]:invalid &,[data-group][data-invalid] &,.group:invalid &,.group[data-invalid] &",
        },
        peerInvalid: {
            selector:
                "&[data-peer]:invalid ~ &,[data-peer][data-invalid] ~ &,.peer:invalid ~ &,.peer[data-invalid] ~ &",
        },
        groupChecked: {
            selector:
                "[role=group]:checked &,[role=group][data-checked] &,[data-group]:checked &,[data-group][data-checked] &,.group:checked &,.group[data-checked] &",
        },
        peerChecked: {
            selector:
                "&[data-peer]:checked ~ &,[data-peer][data-checked] ~ &,.peer:checked ~ &,.peer[data-checked] ~ &",
        },
        groupFocusWithin: {
            selector: "&[role=group]:focus-within &, [data-group]:focus-within &, .group:focus-within &",
        },
        peerFocusWithin: {
            selector: "&[data-peer]:focus-within ~ &,.peer:focus-within ~ &",
        },
        peerPlaceholderShown: {
            selector: "&[data-peer]::placeholder-shown ~ &,.peer::placeholder-shown ~ &",
        },
        _placeholder: { selector: "&::placeholder" },
        placeholderShown: { selector: "&::placeholder-shown" },
        fullScreen: { selector: "&:fullscreen" },
        selection: { selector: "&::selection" },
        rtl: { selector: "&[dir=rtl] &,&[dir=rtl]" },
        ltr: { selector: "&[dir=ltr] &,&[dir=ltr]" },
        mediaDark: { "@media": "(prefers-color-scheme: dark)" },
        mediaReduceMotion: { "@media": "(prefers-reduced-motion: reduce)" },
        dark: { selector: "&[data-theme=dark] &,&[data-theme=dark]" },
        light: { selector: "&[data-theme=light] &,&[data-theme=light]" },
        // dark: { selector: `&[data-theme=dark] &,[data-theme=dark] &,.${darkMode} &` },
        // light: { selector: `&[data-theme=light] &,[data-theme=light] &,.${lightMode} &` },
        resizeHandleActive: { selector: "[data-resize-handle-active] &" },
        panelHorizontalActive: { selector: '[data-panel-group-direction="horizontal"] &' },
        panelVerticalActive: { selector: '[data-panel-group-direction="vertical"] &' },
    },
    properties: {
        boxShadow: tokens.shadows,
        textShadow: tokens.shadows,
        opacity: {
            "0": "0",
            "0.4": "0.6",
            "0.6": "0.6",
            "1": "1",
        },
        cursor: true,
        pointerEvents: true,
        userSelect: true,
        //
        fontFamily: tokens.typography.fonts,
        fontSize: tokens.typography.fontSizes,
        fontWeight: tokens.typography.fontWeights,
        lineHeight: tokens.typography.lineHeights,
        letterSpacing: tokens.typography.letterSpacings,
        textAlign: true,
        fontStyle: true,
        textTransform: true,
        textDecoration: true,
        //
        position: true,
        display: true,
        flexDirection: true,
        flexShrink: true,
        flexGrow: true,
        flex: true,
        flexWrap: true,
        justifyContent: true,
        justifySelf: true,
        alignItems: true,
        alignSelf: true,
        top: sizes,
        bottom: sizes,
        left: sizes,
        right: sizes,
        inset: sizes,
        // base props
        width: sizes,
        minWidth: sizes,
        maxWidth: sizes,
        height: sizes,
        minHeight: sizes,
        maxHeight: sizes,
        whiteSpace: true,
        textOverflow: true,
        overflow: true,
        overflowX: true,
        overflowY: true,
        visibility: true,
        verticalAlign: true,
        // spacing props
        // TODO negative values
        // https://github.com/vanilla-extract-css/vanilla-extract/blob/master/site/src/system/styles/sprinkles.css.ts
        gap: space,
        rowGap: space,
        columnGap: space,
        padding: space,
        paddingTop: space,
        paddingBottom: space,
        paddingLeft: space,
        paddingRight: space,
        paddingInlineStart: space,
        paddingInlineEnd: space,
        margin: space,
        marginTop: space,
        marginBottom: space,
        marginLeft: space,
        marginRight: space,
        marginInlineStart: space,
        marginInlineEnd: space,
        border: tokens.borders,
        borderStyle: true,
        borderWidth: tokens.borders,
        borderTopWidth: tokens.borders,
        borderRightWidth: tokens.borders,
        borderBottomWidth: tokens.borders,
        borderLeftWidth: tokens.borders,
        borderTop: tokens.borders,
        borderBottom: tokens.borders,
        borderLeft: tokens.borders,
        borderRight: tokens.borders,
        borderRadius: tokens.radii,
        borderTopLeftRadius: tokens.radii,
        borderTopRightRadius: tokens.radii,
        borderBottomLeftRadius: tokens.radii,
        borderBottomRightRadius: tokens.radii,
        outline: tokens.borders,
        // colors props
        color: colors,
        background: colors,
        backgroundColor: colors,
        borderColor: colors,
        borderTopColor: colors,
        borderBottomColor: colors,
        borderLeftColor: colors,
        borderRightColor: colors,
        outlineColor: colors,
        fill: colors,
        stroke: colors,
        // transform props
        transform: true,
        transformOrigin: true,
        // static properties
        zIndex: tokens.zIndices,
        transition: {
            none: "none",
            slow: "all .3s ease, opacity .3s ease",
            fast: "all .15s ease, opacity .15s ease",
        },
        backgroundSize: true,
        backgroundRepeat: true,
        backgroundPosition: true,
        backgroundAttachment: true,
        wordBreak: true,
        objectFit: true,
        objectPosition: true,
        listStyleType: true,
    },
    shorthands: {
        // base props
        d: ["display"],
        pos: ["position"],
        t: ["top"],
        b: ["bottom"],
        l: ["left"],
        r: ["right"],
        boxSize: ["width", "height"],
        w: ["width"],
        h: ["height"],
        minW: ["minWidth"],
        maxW: ["maxWidth"],
        minH: ["minHeight"],
        maxH: ["maxHeight"],
        placeItems: ["justifyContent", "alignItems"],
        ta: ["textAlign"],
        tt: ["textTransform"],
        fs: ["fontSize"],
        fw: ["fontWeight"],
        // spacing props
        m: ["margin"],
        mt: ["marginTop"],
        mr: ["marginRight"],
        mb: ["marginBottom"],
        ml: ["marginLeft"],
        mx: ["marginLeft", "marginRight"],
        my: ["marginTop", "marginBottom"],
        ms: ["marginInlineStart"],
        me: ["marginInlineEnd"],
        p: ["padding"],
        marginX: ["marginLeft", "marginRight"],
        marginY: ["marginTop", "marginBottom"],
        pt: ["paddingTop"],
        pr: ["paddingRight"],
        pb: ["paddingBottom"],
        pl: ["paddingLeft"],
        px: ["paddingLeft", "paddingRight"],
        paddingX: ["paddingLeft", "paddingRight"],
        paddingY: ["paddingTop", "paddingBottom"],
        ps: ["paddingInlineStart"],
        pe: ["paddingInlineEnd"],
        py: ["paddingTop", "paddingBottom"],
        bw: ["borderWidth"],
        bx: ["borderLeft", "borderRight"],
        borderX: ["borderLeft", "borderRight"],
        by: ["borderTop", "borderBottom"],
        borderY: ["borderTop", "borderBottom"],
        // colors props
        bg: ["background"],
        bgColor: ["backgroundColor"],
        borderXColor: ["borderLeftColor", "borderRightColor"],
    },
});
