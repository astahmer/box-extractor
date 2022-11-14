import { createSprinkles } from "@vanilla-extract/sprinkles";

import { interactiveProperties, responsiveProperties, unresponsiveProperties } from "./base.css";
import { colorStyles } from "./colors.css";
import { spacingStyles } from "./spacing.css";

export const themeSprinkles = createSprinkles(
    unresponsiveProperties,
    responsiveProperties,
    interactiveProperties,
    spacingStyles,
    colorStyles
);
