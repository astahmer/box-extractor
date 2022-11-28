import { isAbsolute, resolve } from "node:path";

import type { SourceFile } from "ts-morph";
import { Project, ts } from "ts-morph";
import type { Plugin } from "vite";
import { normalizePath } from "vite";

import { extract } from "./extractor/extract";
import type { ExtractOptions } from "./extractor/types";

// https://github.com/qmhc/vite-plugin-dts/blob/main/src/plugin.ts
const tsConfigFilePath = "tsconfig.json"; // TODO
const tsRE = /\.tsx?$/;
const ensureAbsolute = (path: string, root: string) => (path ? (isAbsolute(path) ? path : resolve(root, path)) : root);

// Components
// :matches(JsxOpeningElement, JsxSelfClosingElement):has(Identifier[name="ColorBox"]) JsxAttribute > Identifier[name=/color|backgroundColor/] ~ StringLiteral

// Sprinkles fn
// JsxAttributes CallExpression > Identifier[name=/colorSprinkles/]

// TODO use unplugin to get a bundler-agnostic plugin https://github.com/unjs/unplugin

export const createViteBoxExtractor = ({
    components,
    functions = {},
    used,
    onExtracted,
}: Pick<ExtractOptions, "components" | "functions" | "used"> & {
    onExtracted?: (result: ReturnType<typeof extract>, id: string, isSsr?: boolean) => void;
}): Plugin => {
    let project: Project;

    return {
        enforce: "pre",
        name: "vite-box-extractor",
        buildStart() {
            used.clear();
        },
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
        transform(code, id, options) {
            // console.log({ id });
            let sourceFile: SourceFile;

            // add ts file to project so that references can be resolved
            if (tsRE.test(id)) {
                sourceFile = project.createSourceFile(id, code, { overwrite: true });
            }

            if (id.endsWith(".tsx")) {
                const extracted = extract({ ast: sourceFile!, components, functions, used });
                onExtracted?.(extracted, id, options?.ssr);
                // TODO clean relevant part in used map if file is removed
                // which means we have to track what was added in usedMap by file id ?
            }

            return null;
        },
        watchChange(id, change) {
            // console.log({ id, change });
            if (tsRE.test(id) && project) {
                const sourceFile = project.getSourceFile(normalizePath(id));

                sourceFile && project.removeSourceFile(sourceFile);
            }
        },
    };
};
