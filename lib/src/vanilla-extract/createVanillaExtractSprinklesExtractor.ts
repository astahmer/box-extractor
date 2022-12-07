import path from "node:path";

import type { AdapterContext } from "@vanilla-extract/integration";
import { parseFileScope, hash } from "@vanilla-extract/integration";
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
import { hash as objectHash } from "pastable";

const virtualExtCss = ".vanilla.css";
const virtualExtJs = ".vanilla.js";

type OnAfterEvaluateMutation = {
    filePath: string;
    compiled: ReturnType<typeof getCompiledSprinklePropertyByDebugIdPairMap>;
    usedClassNameList: Set<string>;
    original: AdapterContext;
    context: AdapterContext;
    evalResult: Record<string, unknown>;
    usedComponents: UsedComponentsMap;
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
    let compiled: ReturnType<typeof getCompiledSprinklePropertyByDebugIdPairMap>;

    const getAbsoluteVirtualFileId = (source: string) => normalizePath(path.join(config.root, source));
    const shouldForceEmitCssInSsrBuild =
        vanillaExtractOptions?.forceEmitCssInSsrBuild ?? !!process.env["VITE_RSC_BUILD"];

    const extractCache = new Map<string, string>();

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
                onExtracted?.(args);
                if (!server) return;

                const extracted = args.extracted.filter(([_name, values]) => values.length > 0);
                const hashed = hash(objectHash(extracted));

                if (extractCache.has(args.id) && extractCache.get(args.id) === hashed) {
                    return;
                }

                extractCache.set(args.id, hashed);

                const moduleGraph = server.moduleGraph;
                const scopeList = new Set<string>();
                // TODO only reload modules related to the extracted properties
                contextByFilePath.forEach((context) => {
                    for (const serialisedFileScope of Array.from(context.cssByFileScope.keys())) {
                        // prevent reloading the same module twice
                        if (scopeList.has(serialisedFileScope)) continue;
                        scopeList.add(serialisedFileScope);

                        // taken from vanilla-extract/packages/vite-plugin/src/index.ts
                        const fileScope = parseFileScope(serialisedFileScope);

                        const rootRelativeId = `${fileScope.filePath}${
                            config.command === "build" || shouldForceEmitCssInSsrBuild ? virtualExtCss : virtualExtJs
                        }`;
                        const absoluteId = getAbsoluteVirtualFileId(rootRelativeId);

                        const [module] = Array.from(moduleGraph.getModulesByFile(absoluteId) ?? []);

                        if (module) {
                            // yes this sucks a HMR would be way nicer
                            // but i've got NO IDEA how to do it with VE virtual (sometimes .css/sometimes .js) files
                            void server.reloadModule(module);
                        }
                    }
                });
            },
        }),
        vanillaExtractPlugin({
            forceEmitCssInSsrBuild: true, // vite-plugin-ssr needs it, tropical too
            serializeVanillaModule: (cssImports, exports, context, _filePath) => {
                // console.dir({ serializeVanillaModule: true, filePath }, { depth: null });
                return serializeVanillaModuleWithoutUnused(cssImports, exports, context, usedComponents, compiled);
            },
            ...vanillaExtractOptions,
            onEvaluated: (context, evalResult, filePath) => {
                vanillaExtractOptions?.onEvaluated?.(context, evalResult, filePath);
                // console.log({ onEvaluated: true, filePath });
                // console.log({ filePath, fileScope: Array.from(context.cssByFileScope.keys()) });
                // TODO : map prop+value -> className -> context.cssByFileScope[x].rule.selector -> context.cssByFileScope[fileScope] -> fileScope
                // fileScope = css.ts used by an arg of createSprinkles (result of defineProperties)
                // filePath = path direct to a createSprinkles usage
                // so we can invalidate (using server.reloadModule, in the onExtracted callback) precisely the css.ts files impacting the classNames used

                compiled = getCompiledSprinklePropertyByDebugIdPairMap(evalResult);
                const usedClassNameList = getUsedClassNameFromCompiledSprinkles(compiled, usedComponents);
                const original = cloneAdapterContext(context);

                contextByFilePath.set(filePath, original);
                // console.dir({ compiled, evalResult, usedComponents, usedClassNameList }, { depth: null });

                mutateContextByKeepingUsedRulesOnly({
                    context,
                    usedClassNameList,
                    sprinklesClassNames: compiled.sprinklesClassNames,
                    onMutate: ({ before, after, fileScope }) => {
                        console.log({ before: before.length, after: after.length, fileScope, filePath });
                    },
                });
                vanillaExtractOptions?.onAfterEvaluateMutation?.({
                    filePath,
                    compiled,
                    usedClassNameList,
                    original,
                    context,
                    evalResult,
                    usedComponents,
                });
            },
        }) as any,
    ];
};
