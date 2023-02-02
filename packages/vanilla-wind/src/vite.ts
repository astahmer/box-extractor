import path from "node:path";
import { createFilter, FilterPattern, normalizePath, Plugin, ResolvedConfig, ViteDevServer } from "vite";

import { Identifier, Node, Project, SourceFile, ts } from "ts-morph";

import {
    ensureAbsolute,
    extract,
    FunctionNodesMap,
    getBoxLiteralValue,
    query,
    unwrapExpression,
    getAncestorComponent,
    getNameLiteral,
    unquote,
} from "@box-extractor/core";
import type { GenericConfig } from "./defineProperties";
import { createAdapterContext, generateStyleFromExtraction } from "./jit";
import { endFileScope, setFileScope } from "@vanilla-extract/css/fileScope";
import evalCode from "eval";
import fs from "node:fs";
import esbuild from "esbuild";
import { createLogger } from "@box-extractor/logger";

const logger = createLogger("box-ex:vanilla-wind:vite");

const extractThemeConfig = (sourceFile: SourceFile) => {
    const configByName = new Map<string, GenericConfig>();
    const extractedTheme = extract({ ast: sourceFile, functions: ["defineProperties"] });
    const queryList = (extractedTheme.get("defineProperties") as FunctionNodesMap).queryList;
    const from = sourceFile.getFilePath().toString();
    logger.scoped("extract-theme-ast", { from, queryList: queryList.length });

    queryList.forEach((query) => {
        const fromNode = query.fromNode();
        const declaration = fromNode.getParentIfKind(ts.SyntaxKind.VariableDeclaration);
        if (!declaration) return;

        const identifier = unwrapExpression(fromNode.getExpression());
        if (!Node.isIdentifier(identifier)) return;

        const isVanillaWind = identifier.getDefinitions().some((def) => {
            const declaration = def.getDeclarationNode();
            if (!declaration) return false;

            const sourcePath = declaration.getSourceFile().getFilePath().toString();
            logger.scoped("extract-theme-ast", { kind: declaration.getKindName(), sourcePath });
            if (sourcePath.includes("vanilla-wind/dist")) return true;

            if (!Node.isImportSpecifier(declaration)) return false;

            const importedFrom = declaration.getImportDeclaration().getModuleSpecifierValue();
            return importedFrom === "@box-extractor/vanilla-wind";
        });
        logger.scoped("extract-theme-ast", { isVanillaWind });
        if (!isVanillaWind) return;

        const nameNode = declaration.getNameNode();
        const name = nameNode.getText();
        // TODO replace getBoxLiteralValue with specific treatment
        const conf = getBoxLiteralValue(query.box) as GenericConfig;
        configByName.set(name, conf);

        logger.scoped("extract-theme-ast", { name });
    });

    return configByName;
};

const tsConfigFilePath = "tsconfig.json";
const virtualExtCss = ".jit.css";

// TODO add component ref finder

const normalizeTsx = (id: string) => normalizePath(id.endsWith(".tsx") ? id : id + ".tsx");

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
    const themePathList = new Set<string>(); // TODO

    if (options.themeConfig) {
        options.themeConfig.forEach((conf, name) => configByThemeName.set(name, conf));
    }

    const cssCacheMap = new Map<string, string>();
    const themeCacheMap = new Map<string, string>();
    const componentsCacheMap = new Map<string, string>();

    const getAbsoluteFileId = (source: string) => normalizePath(path.join(config?.root ?? "", source));
    const evalTheme = async (themePath: string, content: string) => {
        const transformed = await esbuild.transform(content, {
            platform: "node",
            loader: "ts",
            format: "cjs",
            target: "es2019",
        });
        const mod = evalCode(transformed.code, themePath, { process }, true) as Record<string, unknown>;
        logger("evaluated theme config", { themePath });

        const themeNameList = [] as string[];
        Object.keys(mod).forEach((key) => {
            const conf = typeof mod[key] === "function" && ((mod[key] as any)?.config as GenericConfig);
            if (conf) {
                configByThemeName.set(key, conf);
                themeNameList.push(key);
                logger("found theme config", { key });
            }
        });

        return themeNameList;
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

                if (options.themePath) {
                    const themePath = ensureAbsolute(options.themePath, config.root);
                    const content = await fs.promises.readFile(themePath, "utf8");
                    await evalTheme(themePath, content);
                }
            },
            configureServer(_server) {
                server = _server;
            },
        },
        {
            enforce: "pre",
            name: "vanilla-wind:theme-extract",
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
                    logger.scoped("theme-extract", "[CACHED] no diff", validId);
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

                logger.scoped("theme-extract", "scanning", { validId });
                const extracted = extractThemeConfig(sourceFile);
                extracted.forEach((conf, name) => {
                    configByThemeName.set(name, conf);
                    logger.scoped("theme-extract", "extracted theme config", { name });
                });

                if (extracted.size > 0) {
                    const absoluteId = ensureAbsolute(validId, config.root);

                    const moduleGraph = server.moduleGraph;
                    const [module] = Array.from(moduleGraph.getModulesByFile(absoluteId) ?? []);
                    if (!themePathList.has(absoluteId) && module) {
                        logger.scoped("theme-extract", "new theme found, reloading importers modules of", module.id);
                        module.importers.forEach(async (imported) => {
                            imported.isSelfAccepting = false;
                            await server.reloadModule(imported);
                        });
                    }

                    themePathList.add(absoluteId);

                    if (module) {
                        const timestamp = Date.now();

                        module.importers.forEach((imported) => {
                            logger.scoped("theme-extract", "invalidating after theme change", imported.id);

                            moduleGraph.invalidateModule(imported);
                            // Vite uses this timestamp to add `?t=` query string automatically for HMR.
                            imported.lastHMRTimestamp = (imported as any).lastInvalidationTimestamp || timestamp;
                        });
                    }
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
            transform(code, id, _options) {
                if (!isIncluded(id)) return null;

                const validId = id.split("?")[0]!;

                // avoid full AST-parsing if possible
                if (!code.includes("WithStyledProps")) {
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
                if (!sourceFile) return null;

                const identifierList = query<Identifier>(
                    sourceFile,
                    'TypeReference:has(Identifier[name="WithStyledProps"]) > TypeQuery > Identifier'
                );
                identifierList.forEach((identifier) => {
                    const component = getAncestorComponent(identifier);
                    if (!component) return null;

                    const themeName = unquote(getNameLiteral(identifier));
                    const componentName = unquote(getNameLiteral(component));

                    themeNameByComponentName.set(componentName, themeName);
                    logger.scoped("root-component-finder", { themeName, componentName });
                });
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

                if (!cssCacheMap.has(validId)) {
                    return;
                }

                const css = cssCacheMap.get(validId);

                if (typeof css !== "string") {
                    return;
                }

                if (!validId.endsWith(virtualExtCss)) {
                    return;
                }

                return css;
            },
            // shouldTransformCachedModule(options) {
            //     logger.scoped("usage", { shouldTransformCachedModule: true, id: options.id });
            //     return true;
            // },
            transform(code, id, _options) {
                if (!isIncluded(id)) return null;

                const validId = id.split("?")[0]!;
                logger.scoped("usage", "scanning", { validId });

                if (validId.endsWith(virtualExtCss)) {
                    return null;
                }

                // avoid full AST-parsing if possible
                const functionNames = [] as string[];
                Array.from(configByThemeName.keys()).forEach((name) => {
                    if (code.includes(`${name}(`)) {
                        functionNames.push(name);
                    }
                });

                const componentNames = [] as NonNullable<typeof options.components>;
                (options?.components ?? [])
                    .concat(
                        Array.from(themeNameByComponentName.entries()).map(([name, themeName]) => ({ name, themeName }))
                    )
                    .forEach((component) => {
                        if (code.includes(`<${component.name}`)) {
                            componentNames.push(component);
                        }
                    });

                if (functionNames.length === 0 && componentNames.length === 0) {
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

                logger.scoped("usage", { id: validId, functionNames, componentNames });
                functionNames.forEach((name) => {
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

                componentNames.forEach((component) => {
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

                    result.toReplace.forEach((className, node) => {
                        // console.log({ node: node.getText(), kind: node.getKindName(), className });
                        if (Node.isJsxSelfClosingElement(node) || Node.isJsxOpeningElement(node)) {
                            node.addAttribute({ name: "_styled", initializer: `"${className}"` });
                        } else if (Node.isIdentifier(node)) {
                            const jsxAttribute = node.getParentIfKind(ts.SyntaxKind.JsxAttribute);
                            if (jsxAttribute) {
                                jsxAttribute.remove();
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

                cssCacheMap.set(absoluteId, css);

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
