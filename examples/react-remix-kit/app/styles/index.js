var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../../packages/vanilla-theme/src/css/index.ts
var css_exports = {};
__export(css_exports, {
  colorModeVars: () => colorModeVars,
  darkMode: () => darkMode,
  externalSprinkles: () => externalSprinkles,
  lightMode: () => lightMode,
  themeSprinkles: () => themeSprinkles
});
module.exports = __toCommonJS(css_exports);

// ../../packages/vanilla-theme/src/css/color-mode.css.ts
var colorModeVars = { color: { primary: "var(--color-primary__ckpecl0)", secondary: "var(--color-secondary__ckpecl1)" } };
var darkMode = "color-mode_darkMode__ckpecl3";
var lightMode = "color-mode_lightMode__ckpecl2";

// ../../packages/vanilla-theme/src/css/external.css.ts
var import_createRuntimeSprinkles = require("@vanilla-extract/sprinkles/createRuntimeSprinkles");
var externalSprinkles = (0, import_createRuntimeSprinkles.createSprinkles)({ conditions: { defaultCondition: "idle", conditionNames: ["idle", "focus", "hover"], responsiveArray: void 0 }, styles: { color: { values: {} } } });

// ../../packages/vanilla-theme/src/css/sprinkles.css.ts
var import_createRuntimeBoxSprinkles = require("@box-extractor/vanilla-extract/createRuntimeBoxSprinkles");
var themeSprinkles = (0, import_createRuntimeBoxSprinkles.createRuntimeBoxSprinkles)({ conditions: void 0, styles: {} }, { conditions: { defaultCondition: "default", conditionNames: ["mobile", "tablet", "desktop", "default", "hover", "active", "focus", "highlighted", "focusWithin", "focusVisible", "disabled", "readOnly", "before", "after", "empty", "expanded", "checked", "grabbed", "pressed", "invalid", "valid", "loading", "selected", "hidden", "autofill", "even", "odd", "first", "last", "notFirst", "notLast", "visited", "activeLink", "activeStep", "indeterminate", "groupHover", "peerHover", "groupFocus", "peerFocus", "groupFocusVisible", "peerFocusVisible", "groupActive", "peerActive", "groupDisabled", "peerDisabled", "groupInvalid", "peerInvalid", "groupChecked", "peerChecked", "groupFocusWithin", "peerFocusWithin", "peerPlaceholderShown", "placeholder", "placeholderShown", "fullScreen", "selection", "rtl", "ltr", "mediaDark", "mediaReduceMotion", "dark", "light"], responsiveArray: void 0 }, styles: { color: { values: { "blue.300": { defaultClass: "properties_color_blue.300_default__1r3btmj1dph" } } } } });
