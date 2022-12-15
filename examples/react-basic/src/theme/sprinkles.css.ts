// import { createSprinkles } from "@vanilla-extract/sprinkles";

import { interactiveProperties, staticProperties } from "./base.css";
import { createBoxSprinkles } from "@box-extractor/vanilla-extract";

export const themeSprinkles = createBoxSprinkles(staticProperties, interactiveProperties);
export type ThemeSprinkles = Parameters<typeof themeSprinkles>[0];
