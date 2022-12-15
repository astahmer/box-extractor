import type { SourceFile } from "ts-morph";
import { Project, ts } from "ts-morph";
import type { Plugin as VitePlugin } from "vite";
import { normalizePath } from "vite";

import { defaultIsExtractableFile, ensureAbsolute, AllowedExtensionOptions } from "./extensions-helpers";

import { extract } from "./extractor/extract";
import type { ExtractOptions, UsedComponentsMap } from "./extractor/types";

// https://github.com/qmhc/vite-plugin-dts/blob/main/src/plugin.ts
const tsConfigFilePath = "tsconfig.json"; // TODO

// Components
// :matches(JsxOpeningElement, JsxSelfClosingElement):has(Identifier[name="ColorBox"]) JsxAttribute > Identifier[name=/color|backgroundColor/] ~ StringLiteral

// Sprinkles fn
// JsxAttributes CallExpression > Identifier[name=/colorSprinkles/]

// TODO use unplugin to get a bundler-agnostic plugin https://github.com/unjs/unplugin

export type OnExtractedArgs = {
    extracted: ReturnType<typeof extract>;
    id: string;
    isSsr?: boolean;
    used: UsedComponentsMap;
};
export type CreateViteBoxExtractorOptions = Pick<ExtractOptions, "components" | "functions" | "used"> & {
    onExtracted?: (args: OnExtractedArgs) => void;
} & AllowedExtensionOptions;

export const createViteBoxExtractor = ({
    components,
    functions = {},
    used,
    onExtracted,
    ...options
}: CreateViteBoxExtractorOptions): VitePlugin => {
    const isExtractableFile = options.isExtractableFile ?? defaultIsExtractableFile;

    let project: Project;
    console.log("createViteBoxExtractor", components);
    // TODO arg like include: ["./src/**/*.{ts,tsx}"],
    // rollup createFilter

    return {
        enforce: "pre",
        name: "vite-box-extractor",
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
            if (isExtractableFile(id)) {
                sourceFile = project.createSourceFile(id.endsWith(".tsx") ? id : id + ".tsx", code, {
                    overwrite: true,
                    scriptKind: ts.ScriptKind.TSX,
                });
            }

            // @ts-expect-error
            if (sourceFile && isExtractableFile(id)) {
                const extracted = extract({ ast: sourceFile!, components, functions, used });
                onExtracted?.({ extracted, id, isSsr: Boolean(options?.ssr), used });
                // console.dir({ id, extracted }, { depth: null });
                // TODO clean relevant part in used map if file is removed
                // which means we have to track what was added in usedMap by file id ?
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
