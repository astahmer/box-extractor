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
    MapType,
} from "@box-extractor/core";
import type { GenericConfig } from "./defineProperties";
import { createAdapterContext, generateStyleFromExtraction } from "./jit";
import { endFileScope, setFileScope } from "@vanilla-extract/css/fileScope";
import evalCode from "eval";
import fs from "node:fs";
import esbuild from "esbuild";
import { createLogger } from "@box-extractor/logger";
import { match } from "ts-pattern";
import { createTheme } from "@vanilla-extract/css";
import type { Contract, MapLeafNodes } from "./createTheme";

const logger = createLogger("box-ex:vanilla-wind:vite");

const isImportedFrom = (
    identifier: Identifier,
    importName: string,
    canImportSourcePath?: (sourcePath: string) => boolean
) => {
    return identifier.getDefinitions().some((def) => {
        const declaration = def.getDeclarationNode();
        if (!declaration) return false;

        const sourcePath = declaration.getSourceFile().getFilePath().toString();
        logger.scoped("imported-from", { kind: declaration.getKindName(), sourcePath });
        if (canImportSourcePath?.(sourcePath)) return true;

        if (!Node.isImportSpecifier(declaration)) return false;

        const importedFrom = declaration.getImportDeclaration().getModuleSpecifierValue();
        return importedFrom === importName;
    });
};

const extractFunctionFrom = <Result>(
    sourceFile: SourceFile,
    functionName: string,
    importName?: string,
    canImportSourcePath?: (sourcePath: string) => boolean
) => {
    const resultByName = new Map<string, { result: Result; queryBox: MapType }>();
    const extractedTheme = extract({ ast: sourceFile, functions: [functionName] });
    const queryList = (extractedTheme.get(functionName) as FunctionNodesMap).queryList;
    const from = sourceFile.getFilePath().toString();
    logger.scoped("extract-function-from", { from, queryList: queryList.length });

    queryList.forEach((query) => {
        const fromNode = query.fromNode();
        const declaration = fromNode.getParentIfKind(ts.SyntaxKind.VariableDeclaration);
        if (!declaration) return;

        const identifier = unwrapExpression(fromNode.getExpression());
        if (!Node.isIdentifier(identifier)) return;

        const isImportedFromValid = importName ? isImportedFrom(identifier, importName, canImportSourcePath) : true;
        logger.scoped("extract-function-from", { isImportedFromValid });
        if (!isImportedFromValid) return;

        const nameNode = declaration.getNameNode();
        const name = nameNode.getText();
        // TODO replace getBoxLiteralValue with specific treatment
        const result = getBoxLiteralValue(query.box) as Result;
        resultByName.set(name, { result, queryBox: query.box });

        logger.scoped("extract-function-from", { name });
    });

    return resultByName;
};

const extractThemeConfig = (sourceFile: SourceFile) => {
    const configByName = new Map<string, GenericConfig>();
    const extracted = extractFunctionFrom<GenericConfig>(
        sourceFile,
        "defineProperties",
        "@box-extractor/vanilla-wind",
        (sourcePath) => sourcePath.includes("vanilla-wind/dist")
    );
    extracted.forEach((extract, name) => configByName.set(name, extract.result));

    return configByName;
};

const tsConfigFilePath = "tsconfig.json";
const virtualExtCss = ".jit.css";
// const virtualVanillaExtractCss = ".vanilla-extract.css";

// TODO add component ref finder

const normalizeTsx = (id: string) => normalizePath(id.endsWith(".tsx") ? id : id + ".tsx");

const hasStyledFn = (code: string, styledFn: string) => code.includes(`${styledFn}(`);
const hasStyledComponent = (code: string, styledComponent: string) => code.includes(`<${styledComponent}`);
const hasStyledType = (code: string, styledFn: string) => code.includes(`WithStyledProps<typeof ${styledFn}>`);
const hasAnyStyled = (code: string, name: string) =>
    hasStyledFn(code, name) || hasStyledComponent(code, name) || hasStyledType(code, name);

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
        transformedMap.forEach((code, id) => {
            const [mod] = Array.from(moduleGraph.getModulesByFile(id) ?? []);
            if (!mod) return;

            nameList.forEach((name) => {
                const hasStyledKind = hasStyled(code, name);
                logger.scoped("on-found", { name, hasStyledKind, id });
                if (!hasStyledKind) return;

                moduleGraph.invalidateModule(mod);
                // Vite uses this timestamp to add `?t=` query string automatically for HMR.
                mod.lastHMRTimestamp = (mod as any).lastInvalidationTimestamp || timestamp;
                promises.push(server.reloadModule(mod));

                mod.importers.forEach((importer) => {
                    moduleGraph.invalidateModule(importer);
                    // Vite uses this timestamp to add `?t=` query string automatically for HMR.
                    importer.lastHMRTimestamp = (importer as any).lastInvalidationTimestamp || timestamp;
                    promises.push(server.reloadModule(importer));
                });
            });
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
            name: "vanilla-wind:create-theme",
            transform(code, id, _options) {
                if (!isIncluded(id)) return null;

                const validId = id.split("?")[0]!;

                // avoid full AST-parsing if possible
                if (!code.includes("createTheme(")) {
                    return null;
                }

                const sourceFile = project.createSourceFile(normalizeTsx(validId), code, {
                    overwrite: true,
                    scriptKind: ts.ScriptKind.TSX,
                });

                logger.scoped("create-theme", "scanning", { validId });

                const extracted = extractFunctionFrom<MapLeafNodes<Contract, string>>(sourceFile, "createTheme");
                if (extracted.size === 0) return null;

                const absoluteId = validId + virtualExtCss;
                const ctx = createAdapterContext("debug");
                ctx.setAdapter();
                setFileScope(validId);

                const toReplace = new Map<Node, string>();
                extracted.forEach((extract, name) => {
                    const fromNode = extract.queryBox.fromNode();
                    const theme = createTheme(extract.result);

                    toReplace.set(fromNode, `${JSON.stringify(theme, null, 4)} as const`);
                    logger.scoped("create-theme", { name, theme });
                    // logger.scoped("create-theme", "extracted createTheme", { name, fromNode: fromNode.getText() });
                });

                toReplace.forEach((value, node) => {
                    if (node.wasForgotten()) return null;
                    node.replaceWithText(value);
                });

                const updated = `import "${absoluteId}";\n` + sourceFile.getFullText();
                transformedMap.set(validId, updated);

                const styles = ctx.getCss();
                const css = styles.cssMap.get(validId)!;

                endFileScope();
                ctx.removeAdapter();

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

                // TODO handle cssCacheMap on same absoluteId (createTheme + usage-extract)
                if (css) {
                    cssCacheMap.set(absoluteId, css);
                }

                return {
                    code: updated,
                };
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
                    logger.scoped("theme-extract", "extracted theme config", { name, conf });
                });

                if (extracted.size > 0) {
                    logger.scoped("theme-extract", "new themes found: ", Array.from(extracted.keys()));
                    const absoluteId = ensureAbsolute(validId, config.root);

                    if (!themePathList.has(absoluteId)) {
                        logger.scoped("theme-extract", "reloading importers modules of", absoluteId);
                        logger({ root: config.root });

                        await onStyledFound(Array.from(extracted.keys()), "any");
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

                const identifierList = query<Identifier>(
                    sourceFile,
                    'TypeReference:has(Identifier[name="WithStyledProps"]) > TypeQuery > Identifier'
                );
                const foundComponentNameList = new Set<string>();
                identifierList.forEach((identifier) => {
                    const component = getAncestorComponent(identifier);
                    if (!component) return null;

                    const themeName = unquote(getNameLiteral(identifier));
                    const componentName = unquote(getNameLiteral(component));

                    if (themeNameByComponentName.get(componentName) !== themeName) {
                        foundComponentNameList.add(componentName);
                    }

                    themeNameByComponentName.set(componentName, themeName);
                    logger.scoped("root-component-finder", { themeName, componentName });
                });

                if (foundComponentNameList.size > 0) {
                    logger.scoped(
                        "root-component-finder",
                        "new components found: ",
                        Array.from(foundComponentNameList)
                    );
                    await onStyledFound(Array.from(foundComponentNameList), "component");
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
