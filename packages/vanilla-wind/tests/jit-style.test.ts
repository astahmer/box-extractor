import type { BoxNodesMap, ExtractOptions } from "@box-extractor/core";
import { extract } from "@box-extractor/core";
import { Project, SourceFile, ts } from "ts-morph";
import { afterEach, expect, it } from "vitest";

import { endFileScope, setFileScope } from "@vanilla-extract/css/fileScope";
import { createAdapterContext } from "../src/jit-style";
import { generateStyleFromExtraction } from "../src/generateStyleFromExtraction";

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

const extractFromCode = (code: string | SourceFile, options?: Partial<ExtractOptions>) => {
    const extractMap = new Map() as BoxNodesMap;
    const fileName = `file${fileCount++}.tsx`;
    sourceFile =
        typeof code === "string" ? project.createSourceFile(fileName, code, { scriptKind: ts.ScriptKind.TSX }) : code;
    const extracted = extract({ ast: sourceFile, extractMap, ...options });
    // console.dir({ test: true, usedMap, extracted }, { depth: null });
    return extracted;
};

it("simple CallExpression extract + JIT style + replace call by generated className", () => {
    const sourceFile = project.createSourceFile(
        "example.css.ts",
        `
    import { minimalSprinkles } from "./minimalSprinkles.css";

    export const MinimalSprinklesDemo = () => {
        return <div className={minimalSprinkles({ color: "brand" })}>
            <div className={[minimalSprinkles({ color: "red.100", display: "flex" }), tw({ p: 24, rounded: 'lg' })].join(' ')}></div>
        </div>;
    };`,
        { scriptKind: ts.ScriptKind.TSX }
    );

    const extracted = extractFromCode(sourceFile, { functions: ["minimalSprinkles", "tw"] });

    const ctx = createAdapterContext("debug");
    ctx.setAdapter();
    setFileScope("test/jit-style.test.ts");

    const minimalStyles = generateStyleFromExtraction("minimalSprinkles", extracted.get("minimalSprinkles")!);
    const twStyles = generateStyleFromExtraction("tw", extracted.get("tw")!);

    expect(extracted).toMatchInlineSnapshot(`
      {
          minimalSprinkles: {
              kind: "function",
              nodesByProp: {
                  color: [
                      {
                          type: "literal",
                          value: "brand",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "CallExpression",
                      },
                      {
                          type: "literal",
                          value: "red.100",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "CallExpression",
                      },
                  ],
                  display: [
                      {
                          type: "literal",
                          value: "flex",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "CallExpression",
                      },
                  ],
              },
          },
          tw: {
              kind: "function",
              nodesByProp: {
                  p: [
                      {
                          type: "literal",
                          value: "24",
                          kind: "string",
                          getNode: "NumericLiteral",
                          fromNode: "CallExpression",
                      },
                  ],
                  rounded: [
                      {
                          type: "literal",
                          value: "lg",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "CallExpression",
                      },
                  ],
              },
          },
      }
    `);

    expect(minimalStyles.classMap).toMatchInlineSnapshot(`
      {
          minimalSprinkles_color_brand: "minimalSprinkles_color_brand__1rxundp0",
          "minimalSprinkles_color_red.100": "minimalSprinkles_color_red.100__1rxundp1",
          minimalSprinkles_display_flex: "minimalSprinkles_display_flex__1rxundp2",
      }
    `);

    minimalStyles.toErase.forEach((node) => node.replaceWithText(""));
    minimalStyles.toReplace.forEach((className, node) => node.replaceWithText(className));

    expect(twStyles.classMap).toMatchInlineSnapshot(`
      {
          tw_p_24: "tw_p_24__1rxundp3",
          tw_rounded_lg: "tw_rounded_lg__1rxundp4",
      }
    `);
    twStyles.toErase.forEach((node) => node.replaceWithText(""));
    twStyles.toReplace.forEach((className, node) => node.replaceWithText(className));

    const { cssMap } = ctx.getCss();
    expect(cssMap).toMatchInlineSnapshot(`
      {
          "test/jit-style.test.ts":
              ".minimalSprinkles_color_brand__1rxundp0 {\\n  color: brand;\\n}\\n.minimalSprinkles_color_red\\\\.100__1rxundp1 {\\n  color: red.100;\\n}\\n.minimalSprinkles_display_flex__1rxundp2 {\\n  display: flex;\\n}\\n.tw_p_24__1rxundp3 {\\n  p: 24;\\n}\\n.tw_rounded_lg__1rxundp4 {\\n  rounded: lg;\\n}",
      }
    `);

    expect(sourceFile.getFullText()).toMatchInlineSnapshot(`
      "
          import { minimalSprinkles } from "./minimalSprinkles.css";

          export const MinimalSprinklesDemo = () => {
              return <div className={minimalSprinkles_color_brand__1rxundp0}>
                  <div className={[minimalSprinkles_display_flex__1rxundp2, tw_rounded_lg__1rxundp4].join(' ')}></div>
              </div>;
          };"
    `);

    endFileScope();
    ctx.removeAdapter();
});
