import { addFunctionSerializer } from "@vanilla-extract/css/functionSerializer";
import { createBoxSprinklesInternal } from "./createBoxSprinklesInternal";
import type { SprinklesProperties } from "./types";

export function createBoxSprinkles<Configs extends readonly SprinklesProperties[]>(...definePropsFn: Configs) {
    const original = createBoxSprinklesInternal(...definePropsFn);

    const sprinklesFn: typeof original = (props) => original(props);
    sprinklesFn.properties = original.properties;
    sprinklesFn.conditions = original.conditions;
    sprinklesFn.shorthands = original.shorthands;

    return addFunctionSerializer(sprinklesFn, {
        importPath: "@box-extractor/vanilla-extract/createRuntimeBoxSprinkles",
        importName: "createRuntimeBoxSprinkles",
        args: definePropsFn,
    });
}
