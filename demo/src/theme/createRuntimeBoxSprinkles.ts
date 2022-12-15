import { createBoxSprinklesInternal } from "./createBoxSprinklesInternal";

type VarargParameters<T extends (args: any) => any> = T extends (args: infer P) => any ? P : never;
type SprinklesProperties = VarargParameters<typeof createBoxSprinklesInternal>;

export function createRuntimeBoxSprinkles<Configs extends readonly SprinklesProperties[]>(...configs: Configs) {
    // console.log("createRuntimeBoxSprinkles", { configs });
    return Object.assign(createBoxSprinklesInternal(...configs));
}
