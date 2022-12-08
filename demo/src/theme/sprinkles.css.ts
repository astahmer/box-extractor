import { createSprinkles } from "@vanilla-extract/sprinkles";

import { interactiveProperties, responsiveProperties, staticProperties } from "./base.css";

export const themeSprinkles = createSprinkles(staticProperties, responsiveProperties, interactiveProperties);
export type ThemeSprinkles = Parameters<typeof themeSprinkles>[0];
