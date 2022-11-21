import { defineProperties } from "@vanilla-extract/sprinkles";
import { flatColors } from "./colors.css";
import { space } from "./spacing.css";
import { theme } from "./vars";

const absPos = ["auto", 0, "0", "-50%", "0%", "50%", "100%"] as const;
const size = ["auto", "0", "0%", "25%", "50%", "75%", "100%", "100vh", "100vw"] as const;
const flexAlign = ["stretch", "flex-start", "center", "flex-end", "space-around", "space-between"] as const;

const screens = {
    mobile: { max: "599px" },
    tablet: { min: "600px", max: "899px" },
    "gt-tablet": { min: "600px" },
    "lt-small-desktop": { max: "899px" },
    "small-desktop": { min: "900px", max: "1199px" },
    "gt-small-desktop": { min: "900px" },
    "lt-medium-desktop": { max: "1199px" },
    "medium-desktop": { min: "1200px", max: "1799px" },
    "gt-medium-desktop": { min: "1200px" },
    "lt-large-desktop": { max: "1799px" },
    "large-desktop": { min: "1800px" },
} as const;
type TwResponsiveBreakpoints = keyof typeof screens;
type TwResponsiveBreakpointsMap = Record<TwResponsiveBreakpoints, { min?: string; max?: string }>;

// https://github.com/seek-oss/vanilla-extract/blob/2b0abcd646cbbc8836301822c27c10f393870f4a/packages/sprinkles/src/index.ts
type Condition = {
    "@media"?: string;
    "@supports"?: string;
    selector?: string;
};

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
    ) as Record<TwResponsiveBreakpoints, Condition>;

const overflow = ["auto", "hidden", "scroll", "visible"] as const;
export const responsiveProperties = defineProperties({
    conditions: { ...twBreakpointsToAppBreakpoints(screens), default: {} },
    defaultCondition: "default",
    // defaultCondition: "medium-desktop",
    responsiveArray: ["mobile", "tablet", "small-desktop", "medium-desktop"],
    properties: {
        fontFamily: theme.typography.fonts,
        fontSize: theme.typography.fontSizes,
        fontWeight: theme.typography.fontWeights,
        lineHeight: theme.typography.lineHeights,
        letterSpacing: theme.typography.letterSpacings,
        textAlign: ["inherit", "left", "center", "right"],
        fontStyle: ["normal", "italic"],
        textTransform: ["inherit", "uppercase", "lowercase", "capitalize", "none"],
        textDecoration: ["none", "underline", "line-through", "underline"],
        //
        position: ["absolute", "relative", "fixed", "sticky"],
        display: ["none", "flex", "inline-flex", "block", "inline"],
        flexDirection: ["row", "column", "row-reverse"],
        flexShrink: [0, 1] as const,
        flexGrow: [0, 1] as const,
        flex: [0, 1] as const,
        flexWrap: ["wrap", "nowrap", "revert", "wrap-reverse"],
        justifyContent: flexAlign,
        justifySelf: flexAlign,
        alignItems: flexAlign,
        alignSelf: flexAlign,
        top: absPos,
        bottom: absPos,
        left: absPos,
        right: absPos,
        inset: absPos,
        //
        width: size,
        minWidth: size,
        maxWidth: size,
        height: size,
        minHeight: size,
        maxHeight: size,
        whiteSpace: ["nowrap", "unset"],
        overflow: overflow,
        overflowX: overflow,
        overflowY: overflow,
        visibility: ["unset", "hidden", "visible"],
        verticalAlign: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom"],
    },
    // Inspired from https://chakra-ui.com/docs/features/style-props
    shorthands: {
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
    },
});

export const unresponsiveProperties = defineProperties({
    properties: {
        zIndex: theme.zIndices,
        transition: ["none", "all 0.1s ease"],
        backgroundSize: ["cover", "contain"],
        backgroundRepeat: ["no-repeat", "repeat"],
        backgroundPosition: ["center", "top", "bottom", "left", "right"],
        backgroundAttachment: ["fixed", "scroll"],
        wordBreak: ["break-all", "break-word", "normal"],
        objectFit: ["cover", "contain"],
        objectPosition: ["center", "top", "bottom", "left", "right"],
    },
});

/** https://chakra-ui.com/docs/styled-system/style-props#pseudo */
export const interactiveProperties = defineProperties({
    conditions: {
        default: {},
        hover: { selector: "&:hover,&[data-hover]" },
        active: { selector: "&:active,&[data-active]" },
        focus: { selector: "&:focus,&[data-focus]" },
        highlighted: { selector: "&[data-highlighted]" },
        focusWithin: { selector: "&:focus-within" },
        focusVisible: { selector: "&:focus-visible" },
        disabled: { selector: "&[disabled],&[aria-disabled=true],&[data-disabled]" },
        readOnly: { selector: "&[aria-readonly=true],&[readonly],&[data-readonly]" },
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
        indeterminate: { selector: "&:indeterminate,&[aria-checked=mixed],&[data-indeterminate]" },
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
        groupFocusVisible: { selector: "&[role=group]:focus-visible[data-group]:focus-visible.group:focus-visible" },
        peerFocusVisible: { selector: "[data-peer]:focus-visible ~ &, .peer:focus-visible ~ &" },
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
        peerFocusWithin: { selector: "&[data-peer]:focus-within ~ &,.peer:focus-within ~ &" },
        peerPlaceholderShown: { selector: "&[data-peer]::placeholder-shown ~ &,.peer::placeholder-shown ~ &" },
        _placeholder: { selector: "&::placeholder" },
        _placeholderShown: { selector: "&::placeholder-shown" },
        _fullScreen: { selector: "&:fullscreen" },
        _selection: { selector: "&::selection" },
        _rtl: { selector: "&[dir=rtl] &,&[dir=rtl]" },
        _ltr: { selector: "&[dir=ltr] &,&[dir=ltr]" },
        _mediaDark: { "@media": "(prefers-color-scheme: dark)" },
        mediaReduceMotion: { "@media": "(prefers-reduced-motion: reduce)" },
        _dark: { selector: "&[data-theme=dark] &,&[data-theme=dark]" },
        _light: { selector: "&[data-theme=light] &,&[data-theme=light]" },
    },
    defaultCondition: "default",
    properties: {
        boxShadow: theme.shadows,
        textShadow: theme.shadows,
        opacity: {
            "0": "0",
            disabled: "var(--vtmn-opacity_disabled-state)",
            "0.4": "0.6",
            "0.6": "0.6",
            "1": "1",
        },
        cursor: ["inherit", "pointer", "not-allowed", "initial", "wait", "col-resize"],
        pointerEvents: ["inherit", "all", "none"],
        userSelect: ["inherit", "none", "text", "all"],
        //
        fontFamily: theme.typography.fonts,
        fontSize: theme.typography.fontSizes,
        fontWeight: theme.typography.fontWeights,
        lineHeight: theme.typography.lineHeights,
        letterSpacing: theme.typography.letterSpacings,
        textAlign: ["inherit", "left", "center", "right"],
        fontStyle: ["normal", "italic"],
        textTransform: ["inherit", "uppercase", "lowercase", "capitalize", "none"],
        textDecoration: ["none", "underline", "line-through", "underline"],
        //
        position: ["absolute", "relative", "fixed", "sticky"],
        display: ["none", "flex", "inline-flex", "block", "inline"],
        flexDirection: ["row", "column", "row-reverse"],
        flexShrink: [0, 1] as const,
        flexGrow: [0, 1] as const,
        flex: [0, 1] as const,
        flexWrap: ["wrap", "nowrap", "revert", "wrap-reverse"],
        justifyContent: flexAlign,
        justifySelf: flexAlign,
        alignItems: flexAlign,
        alignSelf: flexAlign,
        top: absPos,
        bottom: absPos,
        left: absPos,
        right: absPos,
        inset: absPos,
        // base props
        width: size,
        minWidth: size,
        maxWidth: size,
        height: size,
        minHeight: size,
        maxHeight: size,
        whiteSpace: ["nowrap", "unset"],
        overflow: overflow,
        overflowX: overflow,
        overflowY: overflow,
        visibility: ["unset", "hidden", "visible"],
        verticalAlign: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom"],
        // spacing props
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
        border: theme.borders,
        borderWidth: theme.borders,
        borderTop: theme.borders,
        borderBottom: theme.borders,
        borderLeft: theme.borders,
        borderRight: theme.borders,
        borderRadius: theme.radii,
        outline: theme.borders,
        // colors props
        color: flatColors,
        background: flatColors,
        backgroundColor: flatColors,
        borderColor: flatColors,
        borderTopColor: flatColors,
        borderBottomColor: flatColors,
        borderLeftColor: flatColors,
        borderRightColor: flatColors,
        outlineColor: flatColors,
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
