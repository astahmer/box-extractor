import { Project, SourceFile, ts } from "ts-morph";
import { afterEach, bench, describe } from "vitest";
import { extract } from "../src/extractor/extract";
import { getBoxLiteralValue } from "../src/extractor/getBoxLiteralValue";
import { unbox } from "../src/extractor/unbox";
import type { ExtractOptions, ExtractedFunctionResult } from "../src/extractor/types";
// @ts-expect-error
import { default as BigThemeSampleInlined } from "./samples/BigThemeSampleInlined?raw";

const createProject = () => {
    return new Project({
        compilerOptions: {
            jsx: ts.JsxEmit.React,
            jsxFactory: "React.createElement",
            jsxFragmentFactory: "React.Fragment",
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ESNext,
            noUnusedParameters: false,
            declaration: false,
            noEmit: true,
            emitDeclaratio: false,
            // allowJs: true,
            // useVirtualFileSystem: true,
        },
        // tsConfigFilePath: tsConfigPath,
        skipAddingFilesFromTsConfig: true,
        skipFileDependencyResolution: true,
        skipLoadingLibFiles: true,
    });
};

const project: Project = createProject();

let sourceFile: SourceFile;
afterEach(() => {
    if (!sourceFile) return;

    if (sourceFile.wasForgotten()) return;
    project.removeSourceFile(sourceFile);
});

let fileCount = 0;
const getExtract = (code: string, options: Omit<ExtractOptions, "ast">) => {
    const fileName = `file${fileCount++}.tsx`;
    sourceFile = project.createSourceFile(fileName, code, { scriptKind: ts.ScriptKind.TSX });
    return extract({ ast: sourceFile, ...options });
};

describe("unbox", () => {
    bench("getBoxLiteralValue", () => {
        const extracted = getExtract(BigThemeSampleInlined, { functions: ["defineProperties"] });
        const defineProperties = extracted.get("defineProperties")!;
        const properties = (defineProperties as ExtractedFunctionResult).queryList[0].box;
        const cache = new WeakMap();
        getBoxLiteralValue(properties, cache);
    });

    bench("unbox", () => {
        const extracted = getExtract(BigThemeSampleInlined, { functions: ["defineProperties"] });
        const defineProperties = extracted.get("defineProperties")!;
        const properties = (defineProperties as ExtractedFunctionResult).queryList[0].box;
        const cache = new WeakMap();
        unbox(properties, cache);
    });
});
