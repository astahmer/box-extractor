import { Project, SourceFile, ts } from "ts-morph";
import { afterEach, expect, it } from "vitest";
import {
    findAllTransitiveComponents,
    FindAllTransitiveComponentsOptions,
} from "../src/extractor/findAllTransitiveComponents";
// @ts-ignore
import { default as ExtractSample } from "./ExtractSample?raw";

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

let project: Project = createProject();
let fileCount = 0;

let sourceFile: SourceFile;
afterEach(() => {
    if (!sourceFile) return;

    if (sourceFile.wasForgotten()) return;
    project.removeSourceFile(sourceFile);
});

const components = ["ColorBox"];

const findInCode = (code: string) => {
    const fileName = `file${fileCount++}.tsx`;
    sourceFile = project.createSourceFile(fileName, code, { scriptKind: ts.ScriptKind.TSX });
    // console.log(sourceFile.forEachDescendant((c) => [c.getKindName(), c.getText()]));
    const transitiveMap: FindAllTransitiveComponentsOptions["transitiveMap"] = new Map();
    const names = findAllTransitiveComponents({ ast: sourceFile, components, transitiveMap });
    // console.log({ names });
    return transitiveMap;
};

it("findAllTransitiveComponents", () => {
    expect(findInCode(ExtractSample)).toMatchInlineSnapshot(`
      {
          ColorBox: {
              from: null,
              referencedBy: [
                  "Demo",
                  "Wrapper",
                  "Another",
                  "ArrowSomething",
                  "ArrowWithBlockSomething",
                  "FunctionExpressionSomething",
                  "AnonymousFunctionExpression",
                  "RefSomething",
                  "LiteralRef",
                  "ComputedLiteralRef",
                  "ObjectBindingSomething",
                  "RandomName",
              ],
              refUsedWithSpread: [
                  "Wrapper",
                  "Another",
                  "ArrowSomething",
                  "ArrowWithBlockSomething",
                  "FunctionExpressionSomething",
                  "AnonymousFunctionExpression",
                  "RefSomething",
                  "LiteralRef",
                  "ComputedLiteralRef",
                  "ObjectBindingSomething",
                  "RandomName",
              ],
          },
          Wrapper: {
              from: "ColorBox",
              referencedBy: ["UsingWrapperWithSpread"],
              refUsedWithSpread: ["UsingWrapperWithSpread"],
          },
          Another: {
              from: "ColorBox",
              referencedBy: ["UsingAnotherWithSpread"],
              refUsedWithSpread: [],
          },
          ArrowSomething: {
              from: "ColorBox",
              referencedBy: ["UsingArrowSomethingWithSpread"],
              refUsedWithSpread: ["UsingArrowSomethingWithSpread"],
          },
          ArrowWithBlockSomething: {
              from: "ColorBox",
              referencedBy: ["UsingArrowWithBlockSomethingWithSpread"],
              refUsedWithSpread: ["UsingArrowWithBlockSomethingWithSpread"],
          },
          FunctionExpressionSomething: {
              from: "ColorBox",
              referencedBy: ["UsingFunctionExpressionSomethingWithSpread"],
              refUsedWithSpread: ["UsingFunctionExpressionSomethingWithSpread"],
          },
          AnonymousFunctionExpression: {
              from: "ColorBox",
              referencedBy: ["UsingAnonymousFunctionExpressionWithSpread"],
              refUsedWithSpread: [],
          },
          RefSomething: {
              from: "ColorBox",
              referencedBy: ["UsingRefWithSpread"],
              refUsedWithSpread: [],
          },
          LiteralRef: {
              from: "ColorBox",
              referencedBy: ["UsingLiteralRefWithSpread"],
              refUsedWithSpread: [],
          },
          ComputedLiteralRef: {
              from: "ColorBox",
              referencedBy: ["UsingComputedLiteralRefWithSpread"],
              refUsedWithSpread: [],
          },
          ObjectBindingSomething: {
              from: "ColorBox",
              referencedBy: ["UsingObjectBindingSomethingWithSpread"],
              refUsedWithSpread: [],
          },
          RandomName: {
              from: "ColorBox",
              referencedBy: ["UsingRandomNameWithSpread"],
              refUsedWithSpread: [],
          },
          UsingWrapperWithSpread: {
              from: "Wrapper",
              referencedBy: ["LevelThreeComponent"],
              refUsedWithSpread: ["LevelThreeComponent"],
          },
          UsingArrowSomethingWithSpread: {
              from: "ArrowSomething",
              referencedBy: ["LevelThreeUsingArrowSomethingWithSpread"],
              refUsedWithSpread: [],
          },
          UsingArrowWithBlockSomethingWithSpread: {
              from: "ArrowWithBlockSomething",
              referencedBy: ["LevelThreeUsingArrowWithBlockSomethingWithSpread"],
              refUsedWithSpread: [],
          },
          UsingFunctionExpressionSomethingWithSpread: {
              from: "FunctionExpressionSomething",
              referencedBy: ["LevelThreeUsingFunctionExpressionSomethingWithSpread"],
              refUsedWithSpread: [],
          },
          LevelThreeComponent: {
              from: "UsingWrapperWithSpread",
              referencedBy: ["LevelFourComponentWithSpread"],
              refUsedWithSpread: [],
          },
      }
    `);
});
