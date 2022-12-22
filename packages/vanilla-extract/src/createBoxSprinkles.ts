import { addFunctionSerializer } from "@vanilla-extract/css/functionSerializer";
import { createBoxSprinklesInternal } from "./createBoxSprinklesInternal";
import type { SprinklesProperties } from "./types";

export function createBoxSprinkles<Configs extends readonly SprinklesProperties[]>(...definePropsFn: Configs) {
    // console.log("createBoxSprinkles");
    const original = createBoxSprinklesInternal(...definePropsFn);

    // @ts-expect-error
    const sprinklesFn: typeof original = (props) => original(props);

    return addFunctionSerializer(sprinklesFn, {
        importPath: "@box-extractor/vanilla-extract/createRuntimeBoxSprinkles",
        importName: "createRuntimeBoxSprinkles",
        args: definePropsFn,
    });
}
