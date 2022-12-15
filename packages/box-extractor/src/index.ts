export { createViteBoxExtractor } from "./createViteBoxExtractor";
export { extract } from "./extractor/extract";
export type { ExtractOptions, UsedComponentsMap } from "./extractor/types";
export { createVanillaExtractSprinklesExtractor } from "./vanilla-extract/createVanillaExtractSprinklesExtractor";
export {
    cloneAdapterContext,
    getCompiledSprinklePropertyByDebugIdPairMap,
    getUsedClassNameFromCompiledSprinkles,
    mutateContextByKeepingUsedRulesOnly,
} from "./vanilla-extract/onEvaluated";
export { serializeVanillaModuleWithoutUnused } from "./vanilla-extract/serializeVanillaModuleWithoutUnused";
