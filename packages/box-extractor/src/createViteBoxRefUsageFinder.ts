import type { SourceFile } from "ts-morph";
import { Project, ts } from "ts-morph";
import type { Plugin } from "vite";
import { normalizePath } from "vite";
import type { CreateViteBoxExtractorOptions } from "./createViteBoxExtractor";
import { defaultIsExtractableFile, ensureAbsolute } from "./extensions-helpers";

import {
    findAllTransitiveComponents,
    FindAllTransitiveComponentsOptions,
} from "./extractor/findAllTransitiveComponents";

// https://github.com/qmhc/vite-plugin-dts/blob/main/src/plugin.ts

// Components
// :matches(JsxOpeningElement, JsxSelfClosingElement):has(Identifier[name="ColorBox"]) JsxAttribute > Identifier[name=/color|backgroundColor/] ~ StringLiteral

// Sprinkles fn
// JsxAttributes CallExpression > Identifier[name=/colorSprinkles/]

// TODO use unplugin to get a bundler-agnostic plugin https://github.com/unjs/unplugin

// TODO logs with debug

export const createViteBoxRefUsageFinder = ({
    components: _components,
    functions: _functions,
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
    const isExtractableFile = options.isExtractableFile ?? defaultIsExtractableFile;

    let project: Project;
    // console.log('createViteBoxRefUsageFinder', components);

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
        },
        transform(code, id) {
            // console.log({ id });
            let sourceFile: SourceFile;

            // add ts file to project so that references can be resolved
            if (isExtractableFile(id)) {
                sourceFile = project.createSourceFile(id.endsWith(".tsx") ? id : id + ".tsx", code, {
                    overwrite: true,
                    scriptKind: ts.ScriptKind.TSX,
                });
            }

            // @ts-expect-error
            if (sourceFile && isExtractableFile(id)) {
                const transitiveMap: FindAllTransitiveComponentsOptions["transitiveMap"] = new Map();
                findAllTransitiveComponents({ ast: sourceFile!, components: Object.keys(components), transitiveMap });

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
            }

            return null;
        },
        watchChange(id) {
            // console.log({ id, change });
            if (isExtractableFile(id) && project) {
                const sourceFile = project.getSourceFile(normalizePath(id));

                sourceFile && project.removeSourceFile(sourceFile);
            }
        },
    };
};
