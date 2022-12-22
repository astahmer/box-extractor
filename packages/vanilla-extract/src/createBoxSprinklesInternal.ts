import { createSprinkles } from "@vanilla-extract/sprinkles";
import { getSprinklesConfig } from "./getSprinklesConfig";
import type { SprinklesFn } from "./sprinkle-types";
import type { SprinklesProperties } from "./types";

export const createBoxSprinklesInternal = <Configs extends readonly SprinklesProperties[]>(
    ...definePropsFn: Configs
): SprinklesFn<Configs> => {
    // console.log("createBoxSprinklesInternal");
    const original = createSprinkles(...definePropsFn);
    const config = getSprinklesConfig(definePropsFn);

    return Object.assign(original as any, config);
};
