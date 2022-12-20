import { defaultSerializeVanillaModule } from "@vanilla-extract/integration";
import { vanillaExtractPlugin } from "@vanilla-extract/esbuild-plugin";
// import type { VanillaExtractPluginOptions } from "@vanilla-extract/vite-plugin";
import type { VanillaExtractPluginOptions } from "./ve-vite-plugin";
import type { Plugin } from "esbuild";

import { createEsbuildBoxExtractor, UsedComponentsMap } from "@box-extractor/core";
import type { CreateViteBoxExtractorOptions } from "@box-extractor/core";
import {
    getCompiledSprinklePropertyByDebugIdPairMap,
    getUsedClassNameFromCompiledSprinkles,
    mutateContextByKeepingUsedRulesOnly,
} from "./onEvaluated";
import { serializeVanillaModuleWithoutUnused } from "./serializeVanillaModuleWithoutUnused";

export const createEsbuildVanillaExtractSprinklesExtractor = ({
    components,
    functions = {},
    onExtracted,
    vanillaExtractOptions,
    ...options
}: Omit<CreateViteBoxExtractorOptions, "used"> & {
    vanillaExtractOptions?: VanillaExtractPluginOptions;
}): Plugin[] => {
    const usedComponents = new Map() as UsedComponentsMap;

    // can probably delete those cache maps
    const compiledByFilePath = new Map<string, ReturnType<typeof getCompiledSprinklePropertyByDebugIdPairMap>>();
    const sourceByPath = new Map<string, string>();

    return [
        // createViteBoxRefUsageFinder({ ...options, components, functions }),
        createEsbuildBoxExtractor({
            ...options,
            components,
            functions,
            used: usedComponents,
            onExtracted(args) {
                onExtracted?.(args);
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
                return serializeVanillaModuleWithoutUnused(cssImports, exports, context, usedComponents, compiled);
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

                const usedClassNameList = getUsedClassNameFromCompiledSprinkles(compiled, usedComponents);

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
