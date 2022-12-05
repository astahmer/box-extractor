import path from "node:path";

import type { AdapterContext } from "@vanilla-extract/integration";
import { parseFileScope } from "@vanilla-extract/integration";
import { vanillaExtractPlugin, VanillaExtractPluginOptions } from "@vanilla-extract/vite-plugin";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { normalizePath } from "vite";

import { createViteBoxExtractor, CreateViteBoxExtractorOptions } from "../createViteBoxExtractor";
import type { UsedComponentsMap } from "../extractor/types";
import {
    cloneAdapterContext,
    getCompiledSprinklePropertyByDebugIdPairMap,
    getUsedClassNameFromCompiledSprinkles,
    mutateContextByKeepingUsedRulesOnly,
} from "./onEvaluated";
import { serializeVanillaModuleWithoutUnused } from "./serializeVanillaModuleWithoutUnused";
import { createViteBoxRefUsageFinder } from "../createViteBoxRefUsageFinder";

const virtualExtCss = ".vanilla.css";
const virtualExtJs = ".vanilla.js";

type OnAfterEvaluateMutation = {
    filePath: string;
    compiled: ReturnType<typeof getCompiledSprinklePropertyByDebugIdPairMap>;
    usedClassNameList: Set<string>;
    original: AdapterContext;
    context: AdapterContext;
    evalResult: Record<string, unknown>;
};

export const createVanillaExtractSprinklesExtractor = ({
    components,
    functions = {},
    onExtracted,
    vanillaExtractOptions,
    ...options
}: Omit<CreateViteBoxExtractorOptions, "used"> & {
    vanillaExtractOptions?: VanillaExtractPluginOptions & {
        onAfterEvaluateMutation?: (args: OnAfterEvaluateMutation) => void;
    };
    // TODO ignore map (components, functions)
}): Plugin[] => {
    const usedComponents = new Map() as UsedComponentsMap;
    const contextByFilePath = new Map<string, AdapterContext>();

    let server: ViteDevServer;
    let config: ResolvedConfig;

    const getAbsoluteVirtualFileId = (source: string) => normalizePath(path.join(config.root, source));

    return [
        createViteBoxRefUsageFinder({ ...options, components, functions }),
        {
            name: "vite-box-extractor-ve-adapter",
            configResolved(resolvedConfig) {
                config = resolvedConfig;
            },
            configureServer(_server) {
                server = _server;
            },
        },
        createViteBoxExtractor({
            ...options,
            components,
            functions,
            used: usedComponents,
            onExtracted(args) {
                const { isSsr } = args;
                onExtracted?.(args);
                // console.dir({ onExtracted: true, extracted, id }, { depth: null });
                if (!server) return;

                const moduleGraph = server.moduleGraph;

                const scopeList = new Set<string>();
                contextByFilePath.forEach((context) => {
                    for (const serialisedFileScope of Array.from(context.cssByFileScope.keys())) {
                        if (scopeList.has(serialisedFileScope)) continue;
                        scopeList.add(serialisedFileScope);

                        // taken from vanilla-extract/packages/vite-plugin/src/index.ts
                        const fileScope = parseFileScope(serialisedFileScope);
                        const shouldForceEmitCssInSsrBuild = !!process.env["VITE_RSC_BUILD"];

                        const rootRelativeId = `${fileScope.filePath}${
                            config.command === "build" || (isSsr && shouldForceEmitCssInSsrBuild)
                                ? virtualExtCss
                                : virtualExtJs
                        }`;
                        const absoluteId = getAbsoluteVirtualFileId(rootRelativeId);

                        const [module] = Array.from(moduleGraph.getModulesByFile(absoluteId) ?? []);

                        if (module) {
                            void server.reloadModule(module);
                            // console.log({ filePath, serialisedFileScope, absoluteId, rootRelativeId, css });
                        }
                    }
                });
            },
        }),
        vanillaExtractPlugin({
            forceEmitCssInSsrBuild: true, // vite-plugin-ssr needs it, tropical too
            ...vanillaExtractOptions,
            onEvaluated: (context, evalResult, filePath) => {
                vanillaExtractOptions?.onEvaluated?.(context, evalResult, filePath);
                // console.log("onEvaluated");
                // console.log({ filePath, fileScope: Array.from(context.cssByFileScope.keys()) });
                // TODO : map prop+value -> className -> context.cssByFileScope[x].rule.selector -> context.cssByFileScope[fileScope] -> fileScope
                // fileScope = css.ts used by an arg of createSprinkles (result of defineProperties)
                // filePath = path direct to a createSprinkles usage
                // so we can invalidate (using server.reloadModule, in the onExtracted callback) precisely the css.ts files impacting the classNames used

                const compiled = getCompiledSprinklePropertyByDebugIdPairMap(evalResult);
                const usedClassNameList = getUsedClassNameFromCompiledSprinkles(
                    compiled.compiledSprinkleByDebugId,
                    usedComponents
                );
                const original = cloneAdapterContext(context);

                contextByFilePath.set(filePath, original);
                // console.dir({ compiled, evalResult, usedComponents, usedClassNameList }, { depth: null });

                mutateContextByKeepingUsedRulesOnly(context, usedClassNameList, compiled.sprinklesClassNames);
                vanillaExtractOptions?.onAfterEvaluateMutation?.({
                    filePath,
                    compiled,
                    usedClassNameList,
                    original,
                    context,
                    evalResult,
                });
            },
            serializeVanillaModule: (cssImports, exports, context) =>
                serializeVanillaModuleWithoutUnused(cssImports, exports, context, usedComponents),
        }) as any,
    ];
};
