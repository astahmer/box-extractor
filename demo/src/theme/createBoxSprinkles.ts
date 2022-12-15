import { addFunctionSerializer } from "@vanilla-extract/css/functionSerializer";
import { createBoxSprinklesInternal, SprinklesProperties } from "./createBoxSprinklesInternal";

export function createBoxSprinkles<Configs extends readonly SprinklesProperties[]>(...definePropsFn: Configs) {
    // console.log("createBoxSprinkles");
    const original = createBoxSprinklesInternal(...definePropsFn);

    // @ts-expect-error
    const sprinklesFn: typeof original = (props) => original(props);

    return addFunctionSerializer(sprinklesFn, {
        importPath: "./createRuntimeBoxSprinkles",
        importName: "createRuntimeBoxSprinkles",
        args: definePropsFn,
    });
}
