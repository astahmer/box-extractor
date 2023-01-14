export {
    cloneAdapterContext,
    getEvalCompiledResultByKind,
    getUsedClassNameListFromCompiledResult,
    mutateContextByKeepingUsedRulesOnly,
} from "./plugins/onEvaluated";
export { serializeVanillaModuleWithoutUnused } from "./plugins/serializeVanillaModuleWithoutUnused";
