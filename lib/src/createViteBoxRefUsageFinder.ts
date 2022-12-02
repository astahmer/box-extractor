import { isAbsolute, resolve } from "node:path";

import type { SourceFile } from "ts-morph";
import { Project, ts } from "ts-morph";
import type { Plugin } from "vite";
import { normalizePath } from "vite";

import {
    findAllTransitiveComponents,
    FindAllTransitiveComponentsOptions,
} from "./extractor/findAllTransitiveComponents";
import type { ExtractOptions } from "./extractor/types";

// https://github.com/qmhc/vite-plugin-dts/blob/main/src/plugin.ts
const tsConfigFilePath = "tsconfig.json"; // TODO
const tsRE = /\.(tsx?)|(astro)$/;
const ensureAbsolute = (path: string, root: string) => (path ? (isAbsolute(path) ? path : resolve(root, path)) : root);

// Components
// :matches(JsxOpeningElement, JsxSelfClosingElement):has(Identifier[name="ColorBox"]) JsxAttribute > Identifier[name=/color|backgroundColor/] ~ StringLiteral

// Sprinkles fn
// JsxAttributes CallExpression > Identifier[name=/colorSprinkles/]

// TODO use unplugin to get a bundler-agnostic plugin https://github.com/unjs/unplugin

// TODO functions
// TODO logs with debug

export const createViteBoxRefUsageFinder = ({
    components,
    functions = {},
}: Pick<ExtractOptions, "components" | "functions"> & {
    // onExtracted?: (result: ReturnType<typeof extract>, id: string, isSsr?: boolean) => void;
}): Plugin => {
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
            if (tsRE.test(id)) {
                sourceFile = project.createSourceFile(id, code, { overwrite: true });
            }

            if (id.endsWith(".tsx") || id.endsWith(".astro")) {
                const transitiveMap: FindAllTransitiveComponentsOptions["transitiveMap"] = new Map();
                findAllTransitiveComponents({ ast: sourceFile!, components: Object.keys(components), transitiveMap });

                // TODO callback ?
                console.log({ transitiveMap, components });
                transitiveMap.forEach((value, componentName) => {
                    value.refUsedWithSpread.forEach((transitiveName) => {
                        const config = components[value.from ?? componentName];
                        if (config) {
                            components[transitiveName] = config;
                        }
                    });
                });
                console.log("after", { components });
            }

            return null;
        },
        watchChange(id) {
            // console.log({ id, change });
            if (tsRE.test(id) && project) {
                const sourceFile = project.getSourceFile(normalizePath(id));

                sourceFile && project.removeSourceFile(sourceFile);
            }
        },
    };
};
