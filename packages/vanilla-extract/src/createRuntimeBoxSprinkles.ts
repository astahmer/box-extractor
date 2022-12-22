import type { SprinklesProperties } from "./types";
import { createBoxSprinklesInternal } from "./createBoxSprinklesInternal";
import type { SprinklesFn } from "./sprinkle-types";

export function createRuntimeBoxSprinkles<Configs extends readonly SprinklesProperties[]>(
    ...configs: Configs
): SprinklesFn<Configs> {
    // console.log("createRuntimeBoxSprinkles", { configs });
    return Object.assign(createBoxSprinklesInternal(...configs));
}
