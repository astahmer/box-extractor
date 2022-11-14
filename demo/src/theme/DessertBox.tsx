import { createBox } from "@dessert-box/react";
import type { ComponentProps } from "react";

import { themeSprinkles } from "./sprinkles.css";

export const DessertBox = createBox({ atoms: themeSprinkles });

export type BoxProps = ComponentProps<typeof DessertBox>;
