export { createViteVanillaExtractSprinklesExtractor } from "./plugins/createViteVanillaExtractSprinklesExtractor";
export {
    cloneAdapterContext,
    getCompiledSprinklePropertyByDebugIdPairMap,
    getUsedClassNameFromCompiledSprinkles,
    mutateContextByKeepingUsedRulesOnly,
} from "./plugins/onEvaluated";
export { serializeVanillaModuleWithoutUnused } from "./plugins/serializeVanillaModuleWithoutUnused";
