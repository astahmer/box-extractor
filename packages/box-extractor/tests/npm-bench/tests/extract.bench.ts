import { bench, describe } from "vitest";

import { extract as extract080 } from "@box-extractor/core-0-8-0";
import { extract as extract075 } from "@box-extractor/core-0-7-5";
import { Project, ts } from "ts-morph";
import { extract } from "../../../src/extractor/extract";
// @ts-expect-error
import { default as ExtractSample } from "../ExtractSample?raw";

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
const sourceFile = project.createSourceFile("aaa.tsx", ExtractSample, { scriptKind: ts.ScriptKind.TSX });

const props = ["color", "backgroundColor", "zIndex", "fontSize", "display", "mobile", "tablet", "desktop", "css"];
const config = {
    ColorBox: {
        properties: props,
        map: new Map(props.map((prop) => [prop, true])),
        object: Object.fromEntries(props.map((prop) => [prop, true])),
    },
};

describe("extract across versions", () => {
    bench(
        "0.7.5",
        () => {
            extract075({ ast: sourceFile, components: config });
        },
        { iterations: 3000 }
    );

    bench(
        "0.8.0",
        () => {
            extract080({
                ast: sourceFile,
                components: {
                    matchTag: ({ tagName }) => Boolean(config[tagName]),
                    matchProp: ({ tagName, propName }) => config[tagName].map.get(propName),
                },
            });
        },
        { iterations: 3000 }
    );

    bench(
        "local",
        () => {
            extract({
                ast: sourceFile,
                components: {
                    matchTag: ({ tagName }) => Boolean(config[tagName]),
                    matchProp: ({ tagName, propName }) => config[tagName].map.get(propName),
                },
            });
        },
        { iterations: 3000 }
    );
});
