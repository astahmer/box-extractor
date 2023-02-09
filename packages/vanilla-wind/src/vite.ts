import path from "node:path";
import { createFilter, FilterPattern, normalizePath, Plugin, ResolvedConfig, ViteDevServer } from "vite";

import { Identifier, Node, Project, ts } from "ts-morph";

import {
    ensureAbsolute,
    extract,
    extractFunctionFrom,
    FunctionNodesMap,
    getAncestorComponent,
    getNameLiteral,
    query,
    unbox,
    unquote,
} from "@box-extractor/core";
import { createLogger } from "@box-extractor/logger";
import { endFileScope, setFileScope } from "@vanilla-extract/css/fileScope";
import { match } from "ts-pattern";
import type { GenericConfig } from "./defineProperties";
import { createAdapterContext, generateStyleFromExtraction } from "./jit";
import { extractDefinePropertiesConfig } from "./extractDefinePropertiesConfig";
import { findTypeReferenceUsage } from "./findTypeReferenceUsage";
import {
    hasStyledFn,
    hasStyledComponent,
    hasStyledType,
    hasAnyStyled,
    tsConfigFilePath,
    normalizeTsx,
    virtualExtCss,
} from "./utils";
import { assignVars } from "@vanilla-extract/css";

const logger = createLogger("box-ex:vanilla-wind:vite");

// TODO add component ref finder
// TODO extract re-usable pieces from this file so it can be re-used with other plugins
// TODO createSourceFile -> addSourceFile from transformedMap cache if possible

export const vanillaWind = (
    options: {
        /** if you only use 1 theme definition in a dedicated file, use this so there will be less AST parsing needed */
        themePath?: string;
        /** if you know your theme(s) config(s) beforehand, use this so there will be less AST parsing needed */
        themeConfig?: Map<string, GenericConfig>;
        /** if you know your component names + theme config associated beforehand, use this so there will be less AST parsing needed */
        components?: Array<{ name: string; themeName: string }>;
        // TypeReference:has(Identifier[name="WithStyledProps"]):has(TypeQuery)

        tsConfigFilePath?: string;
        /**
         * Regexp or glob patterns to include matches
         * Once this option is defined, the default one will be overwritten.
         *
         * @default /\.[jt]sx?$/
         */
        include?: FilterPattern;
        /**
         * Regexp or glob patterns to exclude matches
         * Once this option is defined, the default one will be overwritten.
         *
         * @default [/node_modules/,  /\.css\.ts$/]
         */
        exclude?: FilterPattern;
    } = {}
) => {
    let server: ViteDevServer;
    let config: ResolvedConfig;
    let project: Project;
    let isIncluded: ReturnType<typeof createFilter>;

    const configByThemeName = new Map<string, GenericConfig>();
    const themeNameByComponentName = new Map<string, string>();
    const themePathList = new Set<string>();

    if (options.themeConfig) {
        options.themeConfig.forEach((conf, name) => configByThemeName.set(name, conf));
    }

    const cssCacheMap = new Map<string, string>();
    const themeCacheMap = new Map<string, string>();
    const componentsCacheMap = new Map<string, string>();
    const transformedMap = new Map<string, string>();

    const getAbsoluteFileId = (source: string) => normalizePath(path.join(config?.root ?? "", source));

    /** HMR after new styled element was found: new theme fn (defineProperties) / component usage / component definition annotated with WithStyled */
    const onStyledFound = async (nameList: string[], kind: "function" | "component" | "type" | "any") => {
        if (nameList.length === 0) return;
        if (!server) return;

        logger.scoped("on-found", { transformedMap: Array.from(transformedMap.keys()) });

        const moduleGraph = server.moduleGraph;
        const hasStyled = match(kind)
            .with("function", () => hasStyledFn)
            .with("component", () => hasStyledComponent)
            .with("type", () => hasStyledType)
            .with("any", () => hasAnyStyled)
            .exhaustive();

        const timestamp = Date.now();
        const promises = [] as Array<Promise<void>>;
        const toInvalidate = new Set<ModuleNode>();

        transformedMap.forEach((code, id) => {
            const [mod] = Array.from(moduleGraph.getModulesByFile(id) ?? []);
            if (!mod) return;

            nameList.forEach((name) => {
                const hasStyledKind = hasStyled(code, name);
                logger.scoped("on-found", { name, hasStyledKind, id });
                if (!hasStyledKind) return;

                toInvalidate.add(mod);
                mod.importers.forEach((importer) => {
                    toInvalidate.add(importer);
                });
            });
        });

        toInvalidate.forEach((mod) => {
            logger("onStyledFound - invalidateModule", { id: mod.id });
                moduleGraph.invalidateModule(mod);
                // Vite uses this timestamp to add `?t=` query string automatically for HMR.
                mod.lastHMRTimestamp = (mod as any).lastInvalidationTimestamp || timestamp;
                promises.push(server.reloadModule(mod));
        });

        return Promise.all(promises);
    };

    // TODO try with 1 global adapter ? + official vanilla-extract plugin since it might clash
    // const ctx = createAdapterContext("debug");
    // ctx.setAdapter();
    // setFileScope("vanilla-wind.css.ts", "vanilla-wind");

    return [
        {
            enforce: "pre",
            name: "vanilla-wind:config",
            buildStart() {
                if (options.themePath) {
                    const themePath = ensureAbsolute(options.themePath, config.root);
                    themePathList.add(themePath);
                    this.addWatchFile(themePath);
                    logger("watching", { themePath });
                }
            },
            async configResolved(resolvedConfig) {
                config = resolvedConfig;

                const root = ensureAbsolute("", resolvedConfig.root);
                const tsConfigPath = ensureAbsolute(options.tsConfigFilePath ?? tsConfigFilePath, root);
                project =
                    project ??
                    new Project({
                        compilerOptions: {
                            jsx: ts.JsxEmit.React,
                            jsxFactory: "React.createElement",
                            jsxFragmentFactory: "React.Fragment",
                            module: ts.ModuleKind.ESNext,
                            moduleResolution: ts.ModuleResolutionKind.NodeNext,
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

                isIncluded = createFilter(options.include ?? /\.[jt]sx?$/, options.exclude ?? [/node_modules/], {
                    resolve: root,
                });
            },
            configureServer(_server) {
                server = _server;
            },
        },
        {
            enforce: "pre",
            name: "vanilla-wind:create-theme",
            transform(code, id, _options) {
                if (!isIncluded(id)) return null;

                const validId = id.split("?")[0]!;
                logger.scoped("create-theme", { id: validId });
                const extracted = extractCreateTheme(project, code, validId);
                logger.scoped("create-theme", { extracted: !!extracted });
                if (!extracted) return null;

                const { updated, content, css, absoluteId } = extracted;
                const updatedCode = css ? updated : content;
                transformedMap.set(validId, updated);

                if (server) {
                    const hasCache = cssCacheMap.has(absoluteId);
                    const hasDiff = hasCache && cssCacheMap.get(absoluteId) !== css;
                    logger.scoped("create-theme", { hasCache, hasDiff });

                    if (hasDiff) {
                        const { moduleGraph } = server;
                        const [module] = Array.from(moduleGraph.getModulesByFile(absoluteId) ?? []);

                        if (module) {
                            logger.scoped("create-theme", "invalidating after css change", absoluteId);
                            moduleGraph.invalidateModule(module);

                            // Vite uses this timestamp to add `?t=` query string automatically for HMR.
                            module.lastHMRTimestamp = (module as any).lastInvalidationTimestamp || Date.now();
                        }
                    }
                }

                logger.scoped("create-theme", { absoluteId, css });
                // TODO handle cssCacheMap on same absoluteId (createTheme + usage-extract)
                if (css) {
                    cssCacheMap.set(absoluteId, css);
                }

                return {
                    code: updatedCode,
                };
            },
        },
        {
            enforce: "pre",
            name: "vanilla-wind:inlined-functions",
            transform(code, id, _options) {
                if (!isIncluded(id)) return null;
                if (!code.includes("assignVars(")) return;

                const validId = id.split("?")[0]!;
                logger.scoped("inlined-functions", { id: validId });

                const sourceFile = project.createSourceFile(normalizeTsx(validId), code, {
                    overwrite: true,
                    scriptKind: ts.ScriptKind.TSX,
                });

                // TODO only allow from VE/css or box-ex/vw ?
                const extracted = extractFunctionFrom(sourceFile, "assignVars", (boxNode) => unbox(boxNode));
                logger.scoped("inlined-functions", { extracted: extracted.size });
                if (extracted.size === 0) return null;

                const toReplace = new Map<Node, any>();
                extracted.forEach((extraction, name) => {
                    logger.scoped("inlined-functions", { name, extraction: extraction.result });
                    if (
                        extraction.queryBox.isList() &&
                        extraction.queryBox.value.length === 2 &&
                        Array.isArray(extraction.result) &&
                        extraction.result.length === 2
                    ) {
                        const [contractNode, tokensNode] = extraction.queryBox.value;

                        if (
                            contractNode &&
                            !contractNode.isUnresolvable() &&
                            tokensNode &&
                            !tokensNode.isUnresolvable()
                        ) {
                            toReplace.set(contractNode.getNode(), extraction.result);
                        }
                    }
                });

                logger.scoped("inlined-functions", { hasUpdatedFile: toReplace.size > 0 });
                if (toReplace.size === 0) return null;

                toReplace.forEach((value, node) => {
                    const [contract, tokens] = value;
                    logger.scoped("inlined-functions", {
                        contract,
                        tokens,
                        updating: node.getText(),
                        type: node.getKindName(),
                    });
                    const result = assignVars(contract, tokens);
                    node.replaceWithText(JSON.stringify(result, null, 4));
                });
                const updated = sourceFile.getFullText();
                transformedMap.set(validId, updated);

                return { code: updated };
            },
        },
        {
            enforce: "pre",
            name: "vanilla-wind:define-properties-extract",
            // Re-parse theme files when they change
            async handleHotUpdate({ file, modules }) {
                if (!themePathList.has(file)) return;

                try {
                    const virtuals: any[] = [];
                    const invalidate = () => {
                        const found = server.moduleGraph.getModulesByFile(file);
                        found?.forEach((m) => {
                            virtuals.push(m);
                            server.moduleGraph.invalidateModule(m);
                            logger("invalidate HMR", { file: m.id });
                        });
                    };

                    invalidate();
                    // load new CSS
                    logger("HMR - ssrLoadModule", { id: file });
                    await server.ssrLoadModule(file);
                    return [...modules, ...virtuals];
                } catch (error) {
                    console.error(error);
                    throw error;
                }
            },
            async transform(code, id, _options) {
                if (!isIncluded(id)) return null;

                const validId = id.split("?")[0]!;

                if (themeCacheMap.has(validId) && themeCacheMap.get(validId) === code) {
                    logger.scoped("define-properties-extract", "[CACHED] no diff", validId);
                    return null;
                }

                themeCacheMap.set(validId, code);

                // avoid full AST-parsing if possible
                if (!code.includes("defineProperties(")) {
                    themeCacheMap.delete(validId);
                    return null;
                }

                const sourceFile = project.createSourceFile(normalizeTsx(validId), code, {
                    overwrite: true,
                    scriptKind: ts.ScriptKind.TSX,
                });

                logger.scoped("define-properties-extract", "scanning", { validId });
                const extracted = extractDefinePropertiesConfig(sourceFile);
                extracted.forEach((conf, name) => {
                    configByThemeName.set(name, conf);
                    logger.scoped("define-properties-extract", "extracted theme config", { name, conf });
                });

                if (extracted.size > 0) {
                    logger.scoped("define-properties-extract", "new themes found: ", Array.from(extracted.keys()));
                    const absoluteId = ensureAbsolute(validId, config.root);

                    if (!themePathList.has(absoluteId)) {
                        logger.scoped("define-properties-extract", "reloading importers modules of", absoluteId);
                        logger({ root: config.root });

                        await onStyledFound(Array.from(extracted.keys()), "any");

                        // TODO check if useful ?
                        if (_options?.ssr) {
                            server.moduleGraph.invalidateAll();
                            server.ws.send({ type: "full-reload", path: absoluteId });
                        }
                    }

                    themePathList.add(absoluteId);
                }

                return null;
            },
            // TODO check if useful ?
            // watchChange(id) {
            //     if (project && isIncluded(id)) {
            //         const sourceFile = project.getSourceFile(normalizeTsx(id));

            //         if (sourceFile) {
            //             project.removeSourceFile(sourceFile);
            //         }
            //     }
            // },
        },
        {
            enforce: "pre",
            name: "vanilla-wind:root-component-finder",
            async transform(code, id, _options) {
                if (!isIncluded(id)) return null;

                const validId = id.split("?")[0]!;

                // avoid full AST-parsing if possible
                if (!code.includes("WithStyledProps<")) {
                    // logger("no used component/functions found", id);
                    componentsCacheMap.delete(validId);
                    return null;
                }

                if (componentsCacheMap.has(validId) && componentsCacheMap.get(validId) === code) {
                    logger.scoped("root-component-finder", "[CACHED] no diff", validId);
                    return null;
                }

                componentsCacheMap.set(validId, code);

                const sourceFile = project.createSourceFile(normalizeTsx(validId), code, {
                    overwrite: true,
                    scriptKind: ts.ScriptKind.TSX,
                });

                const foundComponentsWithTheirThemeName = findTypeReferenceUsage(sourceFile, "WithStyledProps");

                if (foundComponentsWithTheirThemeName.size > 0) {
                    foundComponentsWithTheirThemeName.forEach((themeName, componentName) => {
                    themeNameByComponentName.set(componentName, themeName);
                });

                    const names = Array.from(foundComponentsWithTheirThemeName.keys());
                    logger.scoped("root-component-finder", "new components found: ", names);
                    await onStyledFound(names, "component");
                }
            },
            // watchChange(id) {
            //     if (project && isIncluded(id)) {
            //         const sourceFile = project.getSourceFile(normalizeTsx(id));

            //         if (sourceFile) {
            //             project.removeSourceFile(sourceFile);
            //         }
            //     }
            // },
        },
        {
            enforce: "pre",
            name: "vanilla-wind:usage-extract",
            resolveId(source) {
                const [validId, query] = source.split("?");
                if (!validId || !validId.endsWith(virtualExtCss)) {
                    return;
                }

                // Absolute paths seem to occur often in monorepos, where files are
                // imported from outside the config root.
                const absoluteId = source.startsWith(config.root) ? source : getAbsoluteFileId(validId);

                // There should always be an entry in the `cssMap` here.
                // The only valid scenario for a missing one is if someone had written
                // a file in their app using the .jit.css extension
                if (cssCacheMap.has(absoluteId)) {
                    // Keep the original query string for HMR.
                    return absoluteId + (query ? `?${query}` : "");
                }
            },
            load(id) {
                const [validId] = id.split("?");
                if (!validId) return;

                if (!validId.endsWith(virtualExtCss)) {
                    return;
                }

                logger("load", { id: validId });
                if (!cssCacheMap.has(validId)) {
                    return "";
                }

                const css = cssCacheMap.get(validId);

                if (typeof css !== "string") {
                    return;
                }

                return css;
            },
            async transform(code, id, _options) {
                if (!isIncluded(id)) return null;

                const validId = id.split("?")[0]!;
                logger.scoped("usage", "scanning", { validId });

                if (validId.endsWith(virtualExtCss)) {
                    return null;
                }

                transformedMap.set(validId, code);

                const functionNames = Array.from(configByThemeName.keys());
                const componentNames = (options?.components ?? []).concat(
                    Array.from(themeNameByComponentName.entries()).map(([name, themeName]) => ({ name, themeName }))
                );
                const names = { functions: functionNames, components: componentNames };
                logger.scoped("usage", names);

                // avoid full AST-parsing if possible
                const functionsNameFound = [] as string[];
                functionNames.forEach((name) => {
                    if (code.includes(`${name}(`)) {
                        functionsNameFound.push(name);
                    }
                });

                const componentNamesFound = [] as NonNullable<typeof options.components>;
                componentNames.forEach((component) => {
                    if (code.includes(`<${component.name}`)) {
                        componentNamesFound.push(component);
                    }
                });

                if (functionsNameFound.length === 0 && componentNamesFound.length === 0) {
                    return null;
                }

                const sourceFile = project.createSourceFile(normalizeTsx(validId), code, {
                    overwrite: true,
                    scriptKind: ts.ScriptKind.TSX,
                });

                const absoluteId = validId + virtualExtCss;
                const ctx = createAdapterContext("debug");
                ctx.setAdapter();
                setFileScope(validId);

                logger.scoped("usage", {
                    id: validId,
                    functionNames: functionsNameFound,
                    componentNames: componentNamesFound,
                });
                functionsNameFound.forEach((name) => {
                    logger.scoped("usage", `extracting ${name}() usage...`);
                    const extractResult = extract({ ast: sourceFile, functions: [name] });
                    const extracted = extractResult.get(name)! as FunctionNodesMap;

                    const conf = configByThemeName.get(name);
                    if (!conf) {
                        logger.scoped("usage", `no config found for ${name}() usage. (skipped)`);
                        return;
                    }

                    const result = generateStyleFromExtraction(name, extracted, conf);
                    logger.scoped("usage", { result: result.classMap });
                    result.toReplace.forEach((className, node) => {
                        if (node.wasForgotten()) return;

                        // console.log({ className, node: node.getText(), kind: node.getKindName() });
                        node.replaceWithText(`"${className}"`);
                    });
                });

                componentNamesFound.forEach((component) => {
                    const name = component.name;
                    const themeName = component.themeName;
                    logger.scoped("usage", `extracting <${name} /> usage...`);
                    const extractResult = extract({ ast: sourceFile, components: [name] });
                    const extracted = extractResult.get(name)! as FunctionNodesMap;

                    const conf = configByThemeName.get(themeName);
                    if (!conf) {
                        logger.scoped("usage", `no config found for <${name} /> usage. (skipped)`);
                        return;
                    }

                    const result = generateStyleFromExtraction(themeName, extracted, conf);
                    logger.scoped("usage", { result: result.classMap });

                    const propNameList = new Set(
                        Object.keys(conf.properties ?? {}).concat(
                            Object.keys(conf.shorthands ?? {}).concat(Object.keys(conf.conditions ?? {}))
                        )
                    );

                    result.toReplace.forEach((className, node) => {
                        // console.log({ node: node.getText(), kind: node.getKindName(), className });
                        if (Node.isJsxSelfClosingElement(node) || Node.isJsxOpeningElement(node)) {
                            node.addAttribute({ name: "_styled", initializer: `"${className}"` });
                        } else if (Node.isJsxAttribute(node)) {
                            if (!conf.properties) return;

                            if (propNameList.has(node.getName())) {
                                node.remove();
                            }
                        } else if (Node.isJsxSpreadAttribute(node)) {
                            // TODO only remove the props needed rather than the whole spread, this is a bit too aggressive
                            // also, remove the spread if it's empty
                            node.remove();
                        }
                    });
                });

                const styles = ctx.getCss();
                const css = styles.cssMap.get(validId)!;

                endFileScope();
                ctx.removeAdapter();

                if (server) {
                    const hasCache = cssCacheMap.has(absoluteId);
                    const hasDiff = hasCache && cssCacheMap.get(absoluteId) !== css;
                    logger.scoped("usage", { hasCache, hasDiff });

                    if (hasDiff) {
                        const { moduleGraph } = server;
                        const [module] = Array.from(moduleGraph.getModulesByFile(absoluteId) ?? []);

                        if (module) {
                            logger.scoped("usage", "invalidating after css change", absoluteId);
                            moduleGraph.invalidateModule(module);

                            // Vite uses this timestamp to add `?t=` query string automatically for HMR.
                            module.lastHMRTimestamp = (module as any).lastInvalidationTimestamp || Date.now();
                        }
                    }
                }

                if (css) {
                    cssCacheMap.set(absoluteId, css);
                }

                return {
                    code: `import "${absoluteId}";\n` + sourceFile.getFullText(),
                };
            },
            // watchChange(id) {
            //     if (project && isIncluded(id)) {
            //         const sourceFile = project.getSourceFile(normalizeTsx(id));

            //         if (sourceFile) {
            //             project.removeSourceFile(sourceFile);
            //         }
            //     }
            // },
        },
    ] as Plugin[];
};
