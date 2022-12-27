import debug from "debug";
import { Project, ts } from "ts-morph";
import { createFilter, normalizePath, Plugin } from "vite";
import type { CreateViteBoxExtractorOptions } from "./createViteBoxExtractor";
import { ensureAbsolute } from "./extensions-helpers";

import {
    findAllTransitiveComponents,
    FindAllTransitiveComponentsOptions,
} from "./extractor/findAllTransitiveComponents";

// Components
// :matches(JsxOpeningElement, JsxSelfClosingElement):has(Identifier[name="ColorBox"]) JsxAttribute > Identifier[name=/color|backgroundColor/] ~ StringLiteral

// Sprinkles fn
// JsxAttributes CallExpression > Identifier[name=/colorSprinkles/]

const logger = debug("box-ex:finder:vite");

export const createViteBoxRefUsageFinder = ({
    components: _components = {},
    functions: _functions = {},
    tsConfigFilePath = "tsconfig.json",
    ...options
}: Omit<CreateViteBoxExtractorOptions, "used" | "onExtracted">): Plugin => {
    const components = Array.isArray(_components)
        ? Object.fromEntries(_components.map((name) => [name, { properties: "all" }]))
        : _components;
    // TODO functions
    const functions = Array.isArray(_functions)
        ? Object.fromEntries(_functions.map((name) => [name, { properties: "all" }]))
        : _functions;

    logger("createViteBoxRefUsageFinder", { components, functions });

    let project: Project;
    let isIncluded: ReturnType<typeof createFilter>;
    const cacheMap = new Map<string, string>();

    return {
        enforce: "pre",
        name: "vite-box-ref-usage-finder",
        configResolved(config) {
            const root = ensureAbsolute("", config.root);
            const tsConfigPath = ensureAbsolute(tsConfigFilePath, root);
            project = new Project({
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

            isIncluded = createFilter(
                options.include ?? /\.[jt]sx?$/,
                options.exclude ?? [/node_modules/, /\.css\.ts$/],
                { resolve: root }
            );
        },
        transform(code, id) {
            // console.log({ id });

            if (!isIncluded(id)) return null;
            if (cacheMap.has(id) && cacheMap.get(id) === code) {
                logger("[CACHED] no diff", id);
                return null;
            }

            cacheMap.set(id, code);

            let isUsingExtractableProps = false;
            const componentNames = Array.isArray(components) ? components : Object.keys(components);
            componentNames.forEach((component) => {
                if (code.includes("<" + component)) {
                    isUsingExtractableProps = true;
                }
            });

            const functionNames = Array.isArray(functions) ? functions : Object.keys(functions);
            functionNames.forEach((fn) => {
                if (code.includes(fn + "(")) {
                    isUsingExtractableProps = true;
                }
            });

            if (!isUsingExtractableProps) {
                logger("no used component/functions found", id);
                return null;
            }

            const sourceFile = project.createSourceFile(id.endsWith(".tsx") ? id : id + ".tsx", code, {
                overwrite: true,
                scriptKind: ts.ScriptKind.TSX,
            });

            const transitiveMap: FindAllTransitiveComponentsOptions["transitiveMap"] = new Map();
            findAllTransitiveComponents({ ast: sourceFile, components: Object.keys(components), transitiveMap });

            // TODO callback ?
            // console.log({ transitiveMap, components });
            transitiveMap.forEach((value, componentName) => {
                value.refUsedWithSpread.forEach((transitiveName) => {
                    const config = components[value.from ?? componentName];
                    if (config) {
                        components[transitiveName] = config;
                    }
                });
            });
            // console.log("after", { components });

            return null;
        },
        watchChange(id) {
            // console.log({ id, change });
            if (project && isIncluded(id)) {
                const sourceFile = project.getSourceFile(normalizePath(id));

                sourceFile && project.removeSourceFile(sourceFile);
            }
        },
    };
};
