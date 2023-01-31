import path from "node:path";
import { createFilter, FilterPattern, normalizePath, Plugin, ResolvedConfig, ViteDevServer } from "vite";

import { Node, Project, SourceFile, ts } from "ts-morph";

import { ensureAbsolute, extract, FunctionNodesMap, getBoxLiteralValue, unwrapExpression } from "@box-extractor/core";
import type { GenericConfig } from "./defineProperties";
import { createAdapterContext, generateStyleFromExtraction } from "./jit";
import { endFileScope, setFileScope } from "@vanilla-extract/css/fileScope";
import evalCode from "eval";
import fs from "node:fs";
import esbuild from "esbuild";

const extractThemeConfig = (sourceFile: SourceFile) => {
    const configByName = new Map<string, GenericConfig>();
    const extractedTheme = extract({ ast: sourceFile, functions: ["defineProperties"] });
    const queryList = (extractedTheme.get("defineProperties") as FunctionNodesMap).queryList;

    queryList.forEach((query) => {
        const from = query.fromNode();
        const declaration = from.getParentIfKind(ts.SyntaxKind.VariableDeclaration);
        if (!declaration) return;

        const identifier = unwrapExpression(from.getExpression());
        if (!Node.isIdentifier(identifier)) return;

        const isVanillaWind = identifier.getDefinitions().some((def) => {
            const declaration = def.getDeclarationNode();
            if (!declaration) return false;
            if (!Node.isImportSpecifier(declaration)) return false;

            const importedFrom = declaration.getImportDeclaration().getModuleSpecifierValue();
            // console.log({
            //     declaration: declaration.getText().slice(0, 20),
            //     kind: declaration.getKindName(),
            //     importedFrom,
            // });
            return importedFrom === "@box-extractor/vanilla-wind";
        });
        // console.log({ id, isVanillaWind });
        if (!isVanillaWind) return;

        // console.log({ from: from.getText(), parent: from.getParentOrThrow().getText() });
        const nameNode = declaration.getNameNode();
        const name = nameNode.getText();
        const conf = getBoxLiteralValue(query.box) as GenericConfig;
        configByName.set(name, conf);
        // console.log({ name, conf });
    });

    return configByName;
};

const tsConfigFilePath = "tsconfig.json";
const virtualExtCss = ".jit.css";

export const vanillaWind = (
    options: {
        /** if you only use 1 theme definition in a dedicated file, use this so there will be less AST parsing needed */
        themePath?: string;
        /** if you know your theme(s) config(s) beforehand, use this so there will be less AST parsing needed */
        themeConfig?: Map<string, GenericConfig>;
        skipThemeExtract?: boolean;
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

    const configByName = new Map<string, GenericConfig>();
    if (options.themeConfig) {
        options.themeConfig.forEach((conf, name) => configByName.set(name, conf));
    }

    const cssMap = new Map<string, string>();

    const getAbsoluteFileId = (source: string) => normalizePath(path.join(config?.root ?? "", source));
    const shouldSkipThemeExtract = options.skipThemeExtract ?? options.themePath !== undefined ?? false;

    // const ctx = createAdapterContext("debug");
    // ctx.setAdapter();
    // setFileScope("vanilla-wind.css.ts", "vanilla-wind");

    // only used if skipThemeExtract !== false
    const themeExtractPlugin = {
        enforce: "pre",
        name: "vanilla-wind:theme-extract",
        transform(code, id, _options) {
            if (!isIncluded(id)) return null;

            // avoid full AST-parsing if possible
            if (!code.includes("defineProperties(")) {
                // logger("no used component/functions found", id);
                return null;
            }

            const sourceFile = project.createSourceFile(id.endsWith(".tsx") ? id : id + ".tsx", code, {
                overwrite: true,
                scriptKind: ts.ScriptKind.TSX,
            });

            extractThemeConfig(sourceFile).forEach((conf, name) => configByName.set(name, conf));

            return null;
        },
        // watchChange(id) {
        //     // console.log({ id, change });
        //     if (project && isIncluded(id)) {
        //         const sourceFile = project.getSourceFile(normalizePath(id));

        //         sourceFile && project.removeSourceFile(sourceFile);
        //     }
        // },
    } as Plugin;

    return [
        {
            enforce: "pre",
            name: "vanilla-wind:config",
            configResolved(resolvedConfig) {
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

                isIncluded = createFilter(
                    options.include ?? /\.[jt]sx?$/,
                    options.exclude ?? [/node_modules/, /\.css\.ts$/],
                    { resolve: root }
                );

                if (options.themePath) {
                    const themePath = ensureAbsolute(options.themePath, config.root);
                    const content = fs.readFileSync(themePath, "utf8");
                    const transformed = esbuild.transformSync(content, {
                        platform: "node",
                        loader: "ts",
                        format: "cjs",
                        target: "es2019",
                    });
                    const mod = evalCode(transformed.code, themePath, { process }, true) as Record<string, unknown>;
                    Object.keys(mod).forEach((key) => {
                        const conf = (mod[key] as any)?.config as GenericConfig;
                        if (conf) {
                            configByName.set(key, conf);
                        }
                    });
                }
            },
            configureServer(_server) {
                server = _server;
            },
        },
        ...(shouldSkipThemeExtract ? ([] as Plugin[]) : [themeExtractPlugin]),
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
                if (cssMap.has(absoluteId)) {
                    // Keep the original query string for HMR.
                    return absoluteId + (query ? `?${query}` : "");
                }
            },
            load(id) {
                const [validId] = id.split("?");
                if (!validId) return;

                if (!cssMap.has(validId)) {
                    return;
                }

                const css = cssMap.get(validId);

                if (typeof css !== "string") {
                    return;
                }

                if (!validId.endsWith(virtualExtCss)) {
                    console.log({ id, css });
                    return;
                }

                return css;
            },
            transform(code, id, _options) {
                if (!isIncluded(id)) return null;

                // avoid full AST-parsing if possible
                const functionNames = [] as string[];
                Array.from(configByName.keys()).forEach((name) => {
                    if (code.includes(`${name}(`)) {
                        functionNames.push(name);
                    }
                });

                const usedComponentNames = [] as NonNullable<typeof options.components>;
                (options?.components ?? []).forEach((component) => {
                    if (code.includes(`<${component.name}`)) {
                        usedComponentNames.push(component);
                    }
                });
                if (functionNames.length === 0 && usedComponentNames.length === 0) return null;

                const sourceFile = project.createSourceFile(id.endsWith(".tsx") ? id : id + ".tsx", code, {
                    overwrite: true,
                    scriptKind: ts.ScriptKind.TSX,
                });

                const ctx = createAdapterContext("debug");
                ctx.setAdapter();
                setFileScope(id);

                functionNames.forEach((name) => {
                    const extractResult = extract({ ast: sourceFile, functions: [name] });
                    const extracted = extractResult.get(name)! as FunctionNodesMap;

                    const conf = configByName.get(name);
                    if (!conf) {
                        console.warn(`no config found for ${name}() usage. (skipped)`);
                        return;
                    }

                    const result = generateStyleFromExtraction(name, extracted, conf);
                    result.toReplace.forEach((className, node) => {
                        if (node.wasForgotten()) return;
                        // console.log({ className, node: node.getText(), kind: node.getKindName() });
                        node.replaceWithText(`"${className}"`);
                    });
                });

                // console.log({ usedComponentNames });
                usedComponentNames.forEach((component) => {
                    const name = component.name;
                    const themeName = component.themeName;
                    const extractResult = extract({ ast: sourceFile, components: [name] });
                    const extracted = extractResult.get(name)! as FunctionNodesMap;

                    const conf = configByName.get(themeName);
                    if (!conf) {
                        console.warn(`no config found for <${name} /> usage. (skipped)`);
                        return;
                    }

                    const result = generateStyleFromExtraction(themeName, extracted, conf);
                    console.log({ result: result.classMap });

                    result.toReplace.forEach((className, node) => {
                        console.log({ node: node.getText(), kind: node.getKindName(), className });
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
                const css = styles.cssMap.get(id)!;
                const absoluteId = id + virtualExtCss;

                endFileScope();
                ctx.removeAdapter();

                // console.log({
                //     id,
                //     css,
                //     absoluteId,
                //     current: cssMap.get(absoluteId),
                //     hasDiff: cssMap.get(absoluteId) !== css,
                // });
                if (server && cssMap.has(absoluteId) && cssMap.get(absoluteId) !== css) {
                    const { moduleGraph } = server;
                    const [module] = Array.from(moduleGraph.getModulesByFile(absoluteId) ?? []);

                    if (module) {
                        // console.log("invalidating");
                        moduleGraph.invalidateModule(module);

                        // Vite uses this timestamp to add `?t=` query string automatically for HMR.
                        module.lastHMRTimestamp = (module as any).lastInvalidationTimestamp || Date.now();
                    }
                }

                cssMap.set(absoluteId, css);

                return {
                    code: `import "${absoluteId}";\n` + sourceFile.getFullText(),
                };
            },
        },
    ] as Plugin[];
};
