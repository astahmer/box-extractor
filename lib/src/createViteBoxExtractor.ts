import { isAbsolute, resolve } from "node:path";

import type { SourceFile } from "ts-morph";
import { Project, ts } from "ts-morph";
import { normalizePath } from "vite";
import type { Plugin } from "vite";
import { extract, ExtractOptions } from "./extract";

// https://github.com/qmhc/vite-plugin-dts/blob/main/src/plugin.ts
const tsConfigFilePath = "tsconfig.json";
const tsRE = /\.tsx?$/;
const ensureAbsolute = (path: string, root: string) => (path ? (isAbsolute(path) ? path : resolve(root, path)) : root);

// JsxElement:has(Identifier[name="ColorBox"]) JsxAttribute > Identifier[name=/color|backgroundColor/] ~ StringLiteral

export const createViteBoxExtractor = ({ config, used }: Pick<ExtractOptions, "config" | "used">): Plugin => {
    let project: Project;

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
                    // allowJs: true,
                    // useVirtualFileSystem: true,
                },
                tsConfigFilePath: tsConfigPath,
                skipAddingFilesFromTsConfig: true,
            });
        },

        transform(code, id) {
            let sourceFile: SourceFile;

            // add ts file to project so that references can be resolved
            if (tsRE.test(id)) {
                sourceFile = project.createSourceFile(id, code, { overwrite: true });
            }

            if (id.endsWith(".tsx")) {
                extract({ ast: sourceFile!, config, used });
            }

            return null;
        },
        watchChange(id) {
            if (tsRE.test(id) && project) {
                const sourceFile = project.getSourceFile(normalizePath(id));

                sourceFile && project.removeSourceFile(sourceFile);
            }
        },
        closeBundle() {
            console.log("closeBundle");

            if (project) {
                project.resolveSourceFileDependencies();
            }
        },
    };
};
