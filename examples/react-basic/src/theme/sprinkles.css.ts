// import { createSprinkles } from "@vanilla-extract/sprinkles";

import { interactiveProperties, staticProperties } from "./base.css";
import { createBoxSprinkles } from "./createBoxSprinkles";

export const themeSprinkles = createBoxSprinkles(staticProperties, interactiveProperties);
export type ThemeSprinkles = Parameters<typeof themeSprinkles>[0];
