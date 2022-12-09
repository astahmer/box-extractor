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

    let server: ViteDevServer;
    let config: ResolvedConfig;

    const getAbsoluteFileId = (source: string) => normalizePath(path.join(config.root, source));

    const extractCacheById = new Map<string, { hashed: string; serialized: OnExtractedArgs["extracted"] }>();
    const compiledByFilePath = new Map<string, ReturnType<typeof getCompiledSprinklePropertyByDebugIdPairMap>>();
    const usedDebugIdList = new Set<string>();

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
                const hasCache = Boolean(cached);

                if (serialized.length === 0 && !cached) {
                    // console.log("nothing extracted & no cache");
                    return;
                }

                if (hasCache && cached?.hashed === hashed) {
                    console.log("same as last time", { isSsr: args.isSsr });
                    return;
                }

                const sizeBefore = usedDebugIdList.size;
                args.used.forEach((usedStyles, name) => {
                    usedStyles.properties.forEach((values, propName) =>
                        values.forEach((value) => usedDebugIdList.add(`${name}_${propName}_${value}`))
                    );
                    usedStyles.conditionalProperties.forEach((conditions, conditionName) =>
                        conditions.forEach((values, propName) =>
                            values.forEach((value) =>
                                usedDebugIdList.add(`${name}_${conditionName}_${propName}_${value}`)
                            )
                        )
                    );
                });

                // this file (args.id) changed but we already extracted those styles before, so we don't need to invalidate
                if (sizeBefore === usedDebugIdList.size) {
                    console.log("nothing new, already extracted those styles previously", { isSsr: args.isSsr });
                    return;
                }

                const moduleGraph = server.moduleGraph;
                moduleGraph.invalidateAll(); // TODO rm

                if (hasCache) {
                    // const extractDiff = diff(cached!.serialized, serialized);
                    console.log("has cache & different", { isSsr: args.isSsr });

                    if (args.isSsr) {
                        server.ws.send({ type: "full-reload", path: args.id });
                    } else {
                        console.log("invalidate css");
                        moduleGraph.safeModulesPath.forEach((mod) => {
                            // TODO only invalidate css.ts impacted by the extract change
                            // ex: we now use `<Box color="red.100" />` in `src/home.tsx`
                            // we need to check where does `red.100` come from (Box)
                            // and then where does Box gets its styles from (src/theme/sprinkles.css.ts)
                            // and then invalidate src/theme/sprinkles.css.ts (and not src/theme/vars.css.ts or src/theme/color-modes.css.ts)
                            if (mod.includes(".css.ts")) {
                                const module = moduleGraph.getModuleById(getAbsoluteFileId(mod));
                                if (module) {
                                    console.log(module.id);
                                    moduleGraph.invalidateModule(module);
                                    module.lastHMRTimestamp = (module as any).lastInvalidationTimestamp || Date.now();
                                }
                            }
                        });
                    }
                }

                extractCacheById.set(args.id, { hashed, serialized });
                console.log("extracted", { id: args.id, serialized, isSsr: args.isSsr });
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
