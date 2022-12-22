import type { Plugin } from "esbuild";
import type { CreateViteBoxExtractorOptions } from "./createViteBoxExtractor";
import { ensureAbsolute, tsRE } from "./extensions-helpers";
import { Project, ts } from "ts-morph";
import * as fs from "node:fs";
import { extract } from "./extractor/extract";

export function createEsbuildBoxExtractor({
    components = {},
    functions = {},
    used,
    onExtracted,
    tsConfigFilePath = "tsconfig.json",
}: CreateViteBoxExtractorOptions): Plugin {
    return {
        name: "box-extractor",
        setup(build) {
            const root = ensureAbsolute("", process.cwd());
            const tsConfigPath = ensureAbsolute(tsConfigFilePath, root);
            const project = new Project({
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

            // build.onResolve({ filter: tsRE }, (args) => ({ path: args.path, namespace: boxExtractorNamespace }));

            // build.onLoad({ filter: /.*/, namespace: boxExtractorNamespace }, async ({ path }) => {
            build.onLoad({ filter: tsRE }, async ({ path }) => {
                console.log({ path });
                const code = await fs.promises.readFile(path, "utf8");

                // add ts file to project so that references can be resolved
                const sourceFile = project.createSourceFile(path.endsWith(".tsx") ? path : path + ".tsx", code, {
                    overwrite: true,
                    scriptKind: ts.ScriptKind.TSX,
                });

                const extracted = extract({ ast: sourceFile, components, functions, used });
                onExtracted?.({ extracted, id: path, isSsr: true, used });
                // console.dir({ id, extracted }, { depth: null });

                // eslint-disable-next-line unicorn/no-useless-undefined
                return undefined;
            });
        },
    };
}
