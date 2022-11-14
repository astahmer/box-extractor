import { Project, ts } from "ts-morph";
import { expect, it } from "vitest";
import { extract } from "../src/extract";
import { default as ExtractSample } from "./ExtractSample?raw";

it("", () => {
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
            // allowJs: true,
            // useVirtualFileSystem: true,
        },
        // tsConfigFilePath: tsConfigPath,
        skipAddingFilesFromTsConfig: true,
    });
    const sourceFile = project.createSourceFile("ExtractSample.tsx", ExtractSample);
    // extract(sourceFile)

    console.log(ExtractSample);
});
