import path from "node:path";

import type { AdapterContext } from "@vanilla-extract/integration";
import { parseFileScope, hash, defaultSerializeVanillaModule } from "@vanilla-extract/integration";
import { vanillaExtractPlugin, VanillaExtractPluginOptions } from "@vanilla-extract/vite-plugin";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { normalizePath } from "vite";

import { createViteBoxExtractor, CreateViteBoxExtractorOptions, OnExtractedArgs } from "../createViteBoxExtractor";
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
import diff from "microdiff";

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

    const getAbsoluteFileId = (source: string) => normalizePath(path.join(config.root, source));

    const extractCacheById = new Map<string, { hashed: string; serialized: OnExtractedArgs["extracted"] }>();
    const compiledByFilePath = new Map<string, ReturnType<typeof getCompiledSprinklePropertyByDebugIdPairMap>>();

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

                const serialized = args.extracted.filter(([_name, values]) => values.length > 0);
                // console.dir({ serialized }, { depth: null });
                const hashed = hash(objectHash(serialized));
                const cached = extractCacheById.get(args.id);

                if (serialized.length === 0 && !cached) {
                    console.log("nothing extracted & no cache");
                    return;
                }

                if (extractCacheById.has(args.id) && cached?.hashed === hashed) {
                    console.log("same as last time");
                    return;
                }

                const moduleGraph = server.moduleGraph;
                if (extractCacheById.has(args.id)) {
                    const extractDiff = diff(cached!.serialized, serialized);
                    // TODO use diff to invalidate only the changed modules (by fileScope)
                    console.log("has cache & different");
                    // console.dir(
                    //     {
                    //         id: args.id,
                    //         extracted: serialized,
                    //         hashed,
                    //         cached,
                    //         extractDiff,
                    //     },
                    //     { depth: null }
                    // );

                    moduleGraph.invalidateAll();
                    server.ws.send({ type: "full-reload", path: args.id });
                    // void server.reloadModule()
                }

                extractCacheById.set(args.id, { hashed, serialized });
                console.log("extracted", { id: args.id, serialized });
                // console.log({ id: args.id, keys: Array.from(contextByFilePath.keys()), cached });

                const invalidate = (filePath: string) => {
                    const absoluteId = getAbsoluteFileId(filePath);
                    const modules = moduleGraph.getModulesByFile(absoluteId);
                    if (modules) {
                        modules.forEach((module) => {
                            console.log({ INVALIDATE: module.id });
                            server.moduleGraph.invalidateModule(module);
                            // Vite uses this timestamp to add `?t=` query string automatically for HMR.
                            module.lastHMRTimestamp = (module as any).lastInvalidationTimestamp || Date.now();
                        });
                    }
                };

                const scopeList = new Set<string>();
                // TODO only reload modules related to the extracted properties
                // also filter out modules with NO sprinkles
                contextByFilePath.forEach((context) => {
                    for (const serialisedFileScope of Array.from(context.cssByFileScope.keys())) {
                        // prevent reloading the same module twice
                        if (scopeList.has(serialisedFileScope)) continue;
                        scopeList.add(serialisedFileScope);

                        const fileScope = parseFileScope(serialisedFileScope);

                        invalidate(fileScope.filePath);
                        invalidate(fileScope.filePath + virtualExtJs);
                        invalidate(fileScope.filePath + virtualExtCss);
                    }
                });
            },
        }),
        vanillaExtractPlugin({
            forceEmitCssInSsrBuild: true, // vite-plugin-ssr needs it, tropical too
            serializeVanillaModule: (cssImports, exports, context, filePath) => {
                const compiled = compiledByFilePath.get(filePath);
                // we only care about .css.ts with sprinkles
                if (!compiled || compiled.sprinkleConfigs.size === 0)
                    return defaultSerializeVanillaModule(cssImports, exports, context);

                console.dir({ serializeVanillaModule: true, filePath }, { depth: null });
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

                const compiled = getCompiledSprinklePropertyByDebugIdPairMap(evalResult);
                if (compiled.sprinkleConfigs.size === 0) return;

                compiledByFilePath.set(filePath, compiled);

                const usedClassNameList = getUsedClassNameFromCompiledSprinkles(compiled, usedComponents);
                const original = cloneAdapterContext(context);

                contextByFilePath.set(filePath, original);
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

const serializeValue = <T = unknown>(
    value: T
): T extends Map<infer Key, infer Value>
    ? Key extends string | number | symbol
        ? Record<Key, Value>
        : never
    : T extends Set<infer Item>
    ? Item[]
    : T => {
    if (value == undefined) {
        // @ts-expect-error
        return value;
    }

    if (value instanceof Set) {
        return Array.from(value).map((item) => serializeValue(item)) as any;
    }

    if (value instanceof Map) {
        return Object.fromEntries(Array.from(value.entries()).map(([key, value]) => [key, serializeValue(value)]));
    }

    if (Array.isArray(value)) {
        return value.map((item) => serializeValue(item)) as any;
    }

    if (typeof value === "object" && value !== null) {
        return Object.fromEntries(Object.entries(value).map(([key, value]) => [key, serializeValue(value)])) as any;
    }

    // @ts-expect-error
    return value;
};

const styleUpdateEvent = (fileId: string) => `vanilla-extract-style-update:${fileId}`;
