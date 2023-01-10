import path from "node:path";

import { AdapterContext, defaultSerializeVanillaModule, hash, parseFileScope } from "@vanilla-extract/integration";

import { vanillaExtractPlugin, VanillaExtractPluginOptions } from "@vanilla-extract/vite-plugin";

import type { ModuleNode, Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { normalizePath } from "vite";

import {
    createViteBoxExtractor,
    CreateViteBoxExtractorOptions,
    createViteBoxRefUsageFinder,
    ensureAbsolute,
} from "@box-extractor/core";
import {
    getUsedPropertiesFromExtractNodeMap,
    mergeExtractResultInUsedMap,
    UsedComponentMap,
} from "./getUsedPropertiesFromExtractNodeMap";
import {
    cloneAdapterContext,
    getCompiledSprinklePropertyByDebugIdPairMap,
    getUsedClassNameFromCompiledSprinkles,
    mutateContextByKeepingUsedRulesOnly,
} from "./onEvaluated";
import { serializeVanillaModuleWithoutUnused } from "./serializeVanillaModuleWithoutUnused";
import { createLogger } from "@box-extractor/logger";
import { addMappedPropsToUsedMap } from "./addMappedPropsToUsedMap";
import { Project, ts } from "ts-morph";
// import diff from "microdiff";

type OnAfterEvaluateMutation = {
    filePath: string;
    compiled: ReturnType<typeof getCompiledSprinklePropertyByDebugIdPairMap>;
    usedClassNameList: Set<string>;
    original: AdapterContext;
    context: AdapterContext;
    evalResult: Record<string, unknown>;
    usedComponents: UsedComponentMap;
};

const loggerEval = createLogger("box-ex:ve:eval");
const loggerExtract = createLogger("box-ex:ve:extract");
const loggerSerialize = createLogger("box-ex:ve:serialize");
const loggerResult = createLogger("box-ex:ve:result");

export type CreateViteVanillaExtractSprinklesExtractorOptions = Omit<CreateViteBoxExtractorOptions, "extractMap"> &
    Partial<Pick<CreateViteBoxExtractorOptions, "extractMap">> & {
        usedMap?: UsedComponentMap;
        mappedProps?: Record<string, string[]>;
    };

export const createViteVanillaExtractSprinklesExtractor = ({
    components = {},
    functions = {},
    mappedProps = {},
    onExtracted,
    vanillaExtractOptions,
    extractMap = new Map(),
    usedMap = new Map(),
    project: _project,
    tsConfigFilePath = "tsconfig.json",
    ...options
}: CreateViteVanillaExtractSprinklesExtractorOptions & {
    vanillaExtractOptions?: VanillaExtractPluginOptions & {
        onAfterEvaluateMutation?: (args: OnAfterEvaluateMutation) => void;
    };
}): Plugin[] => {
    let server: ViteDevServer;
    let config: ResolvedConfig;
    let project: Project = _project!;

    const getAbsoluteFileId = (source: string) => normalizePath(path.join(config?.root ?? "", source));

    const extractCacheById = new Map<string, { hashed: string; serialized: string[] }>();
    const compiledByFilePath = new Map<string, ReturnType<typeof getCompiledSprinklePropertyByDebugIdPairMap>>();
    const usedDebugIdList = new Set<string>();
    const sourceByPath = new Map<string, string>();
    const wasInvalidatedButDidntChange = new Set<string>();

    const vanillaModuleCache = new Map<string, string>();
    const usedClassNameListByPath = new Map<string, Set<string>>();
    const usedClassNameListByPathLastTime = new Map<string, Set<string>>();

    return [
        createViteBoxRefUsageFinder({ project, components, functions, ...options }),
        {
            name: "vite-box-extractor-ve-adapter",
            enforce: "pre",
            configResolved(resolvedConfig) {
                config = resolvedConfig;

                const root = ensureAbsolute("", config.root);
                const tsConfigPath = ensureAbsolute(tsConfigFilePath, root);
                project =
                    project ??
                    new Project({
                        compilerOptions: {
                            jsx: ts.JsxEmit.React,
                            jsxFactory: "React.createElement",
                            jsxFragmentFactory: "React.Fragment",
                            module: ts.ModuleKind.ESNext,
                            target: ts.ScriptTarget.ESNext,
                            noUnusedParameters: false,
                            declaration: false,
                            noEmit: true,
                            emitDeclarationOnly: false,
                            allowJs: true,
                            useVirtualFileSystem: true,
                        },
                        tsConfigFilePath: tsConfigPath,
                    });
            },
            configureServer(_server) {
                server = _server;
            },
        },
        createViteBoxExtractor({
            project,
            components,
            functions,
            extractMap,
            ...options,
            onExtracted(args) {
                onExtracted?.(args);
                if (!server) {
                    const extractResult = getUsedPropertiesFromExtractNodeMap(args.extractMap, usedMap);
                    mergeExtractResultInUsedMap(extractResult, usedDebugIdList, usedMap);
                    return;
                }

                if (wasInvalidatedButDidntChange.has(args.id)) {
                    wasInvalidatedButDidntChange.delete(args.id);
                    loggerExtract("removing from invalidated but didn't change list", { id: args.id });
                    return;
                }

                if (args.id.endsWith(".css.ts")) return;

                const extractResult = getUsedPropertiesFromExtractNodeMap(args.extractMap, usedMap);
                const serialized = Array.from(extractResult.usedDebugIdList);

                loggerExtract({ id: args.id, serialized });
                const hashed = hash(serialized.join(""));
                const cached = extractCacheById.get(args.id);
                const hasCache = Boolean(cached);

                if (serialized.length === 0 && !cached) {
                    loggerExtract("nothing extracted & no cache");
                    return;
                }

                if (hasCache && cached?.hashed === hashed) {
                    loggerExtract("same as last time", { isSsr: args.isSsr });
                    return;
                }

                const sizeBefore = usedDebugIdList.size;
                mergeExtractResultInUsedMap(extractResult, usedDebugIdList, usedMap);

                // this file (args.id) changed but we already extracted those styles before, so we don't need to invalidate
                if (sizeBefore === usedDebugIdList.size) {
                    loggerExtract("nothing new, already extracted those styles previously", { isSsr: args.isSsr });
                    return;
                }

                const moduleGraph = server.moduleGraph;

                moduleGraph.invalidateAll();

                if (hasCache) {
                    // const extractDiff = diff(cached!.serialized, serialized);
                    loggerExtract("has cache & different", { isSsr: args.isSsr });

                    if (args.isSsr) {
                        server.ws.send({ type: "full-reload", path: args.id });
                    } else {
                        const invalidated = new Set<string>();
                        const timestamp = Date.now();
                        const invalidate = (mod: ModuleNode | undefined) => {
                            if (!mod?.id) return;
                            // if (invalidated.has(mod.id) || args.id === mod.id) return;
                            if (invalidated.has(mod.id) || args.id === mod.id) return;

                            loggerExtract("invalidated", mod.id);
                            invalidated.add(mod.id);
                            wasInvalidatedButDidntChange.add(mod.id);
                            moduleGraph.invalidateModule(mod);
                            mod.lastHMRTimestamp = timestamp;

                            mod.importers.forEach((nested) => invalidate(nested));
                        };

                        moduleGraph.safeModulesPath.forEach((modPath) => {
                            // TODO only invalidate css.ts impacted by the extract change
                            // ex: we now use `<Box color="red.100" />` in `src/home.tsx`
                            // we need to check where does `red.100` come from (Box)
                            // and then where does Box gets its styles from (src/theme/sprinkles.css.ts)
                            // and then invalidate src/theme/sprinkles.css.ts (and not src/theme/vars.css.ts or src/theme/color-modes.css.ts)
                            if (modPath.includes(".css.ts")) {
                                const maybeModule = moduleGraph.getModuleById(getAbsoluteFileId(modPath));
                                invalidate(maybeModule);
                            }
                        });
                    }
                }

                extractCacheById.set(args.id, { hashed, serialized });
                loggerExtract("extracted", { id: args.id, serialized, isSsr: args.isSsr });
            },
        }),
        vanillaExtractPlugin({
            forceEmitCssInSsrBuild: true, // vite-plugin-ssr needs it, tropical too
            serializeVanillaModule: (cssImports, exports, context, filePath) => {
                const compiled = compiledByFilePath.get(filePath);
                const usedClassNameList = usedClassNameListByPath.get(filePath) ?? new Set();
                const previousUsedClassNameList = usedClassNameListByPathLastTime.get(filePath);

                // re-use the same vanilla module string if the used classes didn't change
                if (previousUsedClassNameList && usedClassNameList.size !== previousUsedClassNameList.size) {
                    loggerSerialize("[FRESH] source changed, deleting cache", { filePath });
                    vanillaModuleCache.delete(filePath);
                } else if (usedClassNameListByPathLastTime.has(filePath)) {
                    loggerSerialize("[CACHED] no diff, same classes used", { filePath });
                }

                usedClassNameListByPathLastTime.set(filePath, usedClassNameList);
                const cached = vanillaModuleCache.get(filePath);

                // we only care about .css.ts with sprinkles
                if (!compiled || compiled.sprinkleConfigs.size === 0) {
                    loggerSerialize("defaultSerializeVanillaModule");
                    const result = cached ?? defaultSerializeVanillaModule(cssImports, exports, context);
                    vanillaModuleCache.set(filePath, result);
                    return result;
                }

                loggerSerialize("serializeVanillaModuleWithoutUnused", { filePath });
                const result =
                    cached ?? serializeVanillaModuleWithoutUnused(cssImports, exports, context, usedMap, compiled);
                vanillaModuleCache.set(filePath, result);
                return result;
            },
            ...vanillaExtractOptions,
            onEvaluated: (args) => {
                const { source, context, evalResult, filePath } = args;
                vanillaExtractOptions?.onEvaluated?.(args);

                // re-use the same compiled object if the file didn't change
                if (source !== sourceByPath.get(filePath)) {
                    compiledByFilePath.delete(filePath);
                    loggerEval("[FRESH] source changed, deleting cache", { filePath });
                } else {
                    loggerEval("[CACHED] same source, reusing compiled", { filePath });
                }

                sourceByPath.set(filePath, source);

                const compiled =
                    compiledByFilePath.get(filePath) ?? getCompiledSprinklePropertyByDebugIdPairMap(evalResult);
                if (compiled.sprinkleConfigs.size === 0) {
                    loggerEval("no sprinkles found", { filePath });
                    return;
                }

                compiledByFilePath.set(filePath, compiled);

                if (mappedProps) {
                    addMappedPropsToUsedMap(mappedProps, usedMap);
                }

                const usedClassNameList = getUsedClassNameFromCompiledSprinkles(compiled, usedMap);
                usedClassNameListByPath.set(filePath, usedClassNameList);

                let original: AdapterContext;
                if (vanillaExtractOptions?.onAfterEvaluateMutation) {
                    original = cloneAdapterContext(context);
                }

                loggerEval.lazy(() => ({
                    filePath,
                    fileScope: Array.from(context.cssByFileScope.keys()).map((scope) =>
                        getAbsoluteFileId(parseFileScope(scope).filePath)
                    ),
                    sprinkles: Array.from(compiled.sprinkleConfigs.keys()),
                    usedClassNameList,
                }));

                mutateContextByKeepingUsedRulesOnly({
                    context,
                    usedClassNameList,
                    sprinklesClassNames: compiled.sprinklesClassNames,
                    onMutate: ({ before, after, fileScope }) => {
                        loggerResult({ before: before.length, after: after.length, fileScope, filePath });
                    },
                });
                vanillaExtractOptions?.onAfterEvaluateMutation?.({
                    filePath,
                    compiled,
                    usedClassNameList,
                    // @ts-expect-error
                    original,
                    context,
                    evalResult,
                    usedComponents: usedMap,
                });
            },
        }) as any,
    ];
};
