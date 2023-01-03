import { vanillaExtractPlugin } from "@vanilla-extract/esbuild-plugin";
import { defaultSerializeVanillaModule } from "@vanilla-extract/integration";
import type { VanillaExtractPluginOptions } from "@vanilla-extract/vite-plugin";
import type { Plugin } from "esbuild";

import { createEsbuildBoxExtractor } from "@box-extractor/core";
import {
    getUsedPropertiesFromExtractNodeMap,
    mergeExtractResultInUsedMap,
} from "./getUsedPropertiesFromExtractNodeMap";
import type { CreateViteVanillaExtractSprinklesExtractorOptions } from "./createViteVanillaExtractSprinklesExtractor";
import {
    getCompiledSprinklePropertyByDebugIdPairMap,
    getUsedClassNameFromCompiledSprinkles,
    mutateContextByKeepingUsedRulesOnly,
} from "./onEvaluated";
import { serializeVanillaModuleWithoutUnused } from "./serializeVanillaModuleWithoutUnused";

export const createEsbuildVanillaExtractSprinklesExtractor = ({
    components = {},
    functions = {},
    onExtracted,
    vanillaExtractOptions,
    extractMap = new Map(),
    usedMap = new Map(),
    ...options
}: CreateViteVanillaExtractSprinklesExtractorOptions & {
    vanillaExtractOptions?: VanillaExtractPluginOptions;
}): Plugin[] => {
    // can probably delete those cache maps
    const compiledByFilePath = new Map<string, ReturnType<typeof getCompiledSprinklePropertyByDebugIdPairMap>>();
    const sourceByPath = new Map<string, string>();
    const usedDebugIdList = new Set<string>();

    return [
        createEsbuildBoxExtractor({
            ...options,
            components,
            functions,
            extractMap,
            onExtracted(args) {
                onExtracted?.(args);
                const extractResult = getUsedPropertiesFromExtractNodeMap(args.extractMap, usedMap);
                mergeExtractResultInUsedMap(extractResult, usedDebugIdList, usedMap);
            },
        }),
        vanillaExtractPlugin({
            forceEmitCssInSsrBuild: true, // vite-plugin-ssr needs it, tropical too
            serializeVanillaModule: (cssImports, exports, context, filePath) => {
                const compiled = compiledByFilePath.get(filePath);
                // we only care about .css.ts with sprinkles
                if (!compiled || compiled.sprinkleConfigs.size === 0) {
                    return defaultSerializeVanillaModule(cssImports, exports, context);
                }

                // console.dir({ serializeVanillaModule: true, filePath }, { depth: null });
                return serializeVanillaModuleWithoutUnused(cssImports, exports, context, usedMap, compiled);
            },
            ...vanillaExtractOptions,
            onEvaluated: (args) => {
                const { source, context, evalResult, filePath } = args;
                vanillaExtractOptions?.onEvaluated?.(args);

                // re-use the same compiled object if the file didn't change
                if (source !== sourceByPath.get(filePath)) {
                    compiledByFilePath.delete(filePath);
                }

                sourceByPath.set(filePath, source);

                const compiled =
                    compiledByFilePath.get(filePath) ?? getCompiledSprinklePropertyByDebugIdPairMap(evalResult);
                if (compiled.sprinkleConfigs.size === 0) return;

                compiledByFilePath.set(filePath, compiled);

                const usedClassNameList = getUsedClassNameFromCompiledSprinkles(compiled, usedMap);

                // console.log({
                //     filePath,
                //     fileScope: Array.from(context.cssByFileScope.keys()).map((scope) =>
                //         getAbsoluteFileId(parseFileScope(scope).filePath)
                //     ),
                //     sprinkles: Array.from(compiled.sprinkleConfigs.keys()),
                // });
                // console.dir({ compiled, usedClassNameList }, { depth: null });

                mutateContextByKeepingUsedRulesOnly({
                    context,
                    usedClassNameList,
                    sprinklesClassNames: compiled.sprinklesClassNames,
                    onMutate: ({ before, after, fileScope }) => {
                        console.log({ before: before.length, after: after.length, fileScope, filePath });
                    },
                });
            },
        }) as any,
    ];
};
