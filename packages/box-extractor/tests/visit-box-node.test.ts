import { Project, SourceFile, ts } from "ts-morph";
import { afterEach, expect, it } from "vitest";
import { extract } from "../src/extractor/extract";
import { visitBoxNode } from "../src/extractor/getBoxLiteralValue";
import { BoxNode } from "../src/extractor/type-factory";
import { ExtractOptions, FunctionNodesMap } from "../src/extractor/types";

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

it("can visit box node", () => {
    const extracted = getExtract(
        `
    import { createTheme, defineProperties } from "@box-extractor/vanilla-wind";

    export const [coreThemeClass,coreThemeVars] = ["_1dghp000", {
        "space": {
            "none": "var(--space-none__1dghp001)",
            "px": "var(--space-px__1dghp002)",
            "xsm": "var(--space-xsm__1dghp003)",
            "small": "var(--space-small__1dghp004)",
        },
        "size": {
            "none": "var(--size-none__1dghp00c)",
            "px": "var(--size-px__1dghp00d)",
            "1/2": "var(--size-1\\/2__1dghp00e)",
            "1/3": "var(--size-1\\/3__1dghp00f)",
            "2/3": "var(--size-2\\/3__1dghp00g)",
        },
        "transition": {
            "fast": "var(--transition-fast__1dghp00q)",
            "slow": "var(--transition-slow__1dghp00r)"
        },
        "backgroundColor": {
            // "error": "var(--backgroundColor-error__1dghp00s)",
            "warning": "var(--backgroundColor-warning__1dghp00t)"
        },
        "color": {
            "white": "var(--color-white__1dghp00u)",
            "black": "var(--color-black__1dghp00v)",
            "error": "var(--color-error__1dghp00w)",
            "warning": "var(--color-warning__1dghp00x)"
        }
    }];

    export const sprinklesFn = defineProperties({
        properties: {
            display: true,
            backgroundColor: coreThemeVars.backgroundColor,
            // borderRadius: coreThemeVars.space,
            // color: coreThemeVars.color,
        },
    });
    `,
        { functions: ["defineProperties"] }
    );
    const defineProperties = extracted.get("defineProperties")!;
    const properties = (defineProperties as FunctionNodesMap).queryList[0].box;

    const visiteds = new Set<BoxNode>();
    visitBoxNode(properties, (node, traversal) => {
        if (visiteds.has(node)) {
            traversal.skip();
            return;
        }

        visiteds.add(node);
    });

    expect(visiteds).toMatchInlineSnapshot(`
      [
          {
              stack: ["CallExpression", "ObjectLiteralExpression"],
              type: "map",
              node: "CallExpression",
              value: {
                  properties: [
                      {
                          stack: [
                              "CallExpression",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "ObjectLiteralExpression",
                          ],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              display: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "TrueKeyword",
                                      ],
                                      type: "literal",
                                      node: "TrueKeyword",
                                      value: true,
                                      kind: "boolean",
                                  },
                              ],
                              backgroundColor: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "PropertyAccessExpression",
                                          "Identifier",
                                          "BindingElement",
                                          "ArrayLiteralExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ObjectLiteralExpression",
                                      ],
                                      type: "map",
                                      node: "ObjectLiteralExpression",
                                      value: {
                                          warning: [
                                              {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                      "BindingElement",
                                                      "ArrayLiteralExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "var(--backgroundColor-warning__1dghp00t)",
                                                  kind: "string",
                                              },
                                          ],
                                      },
                                  },
                              ],
                          },
                      },
                  ],
              },
          },
          {
              stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "ObjectLiteralExpression"],
              type: "map",
              node: "ObjectLiteralExpression",
              value: {
                  display: [
                      {
                          stack: [
                              "CallExpression",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "TrueKeyword",
                          ],
                          type: "literal",
                          node: "TrueKeyword",
                          value: true,
                          kind: "boolean",
                      },
                  ],
                  backgroundColor: [
                      {
                          stack: [
                              "CallExpression",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "PropertyAccessExpression",
                              "Identifier",
                              "BindingElement",
                              "ArrayLiteralExpression",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "ObjectLiteralExpression",
                          ],
                          type: "map",
                          node: "ObjectLiteralExpression",
                          value: {
                              warning: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "PropertyAccessExpression",
                                          "Identifier",
                                          "BindingElement",
                                          "ArrayLiteralExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "StringLiteral",
                                      ],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "var(--backgroundColor-warning__1dghp00t)",
                                      kind: "string",
                                  },
                              ],
                          },
                      },
                  ],
              },
          },
          {
              stack: [
                  "CallExpression",
                  "ObjectLiteralExpression",
                  "PropertyAssignment",
                  "ObjectLiteralExpression",
                  "PropertyAssignment",
                  "TrueKeyword",
              ],
              type: "literal",
              node: "TrueKeyword",
              value: true,
              kind: "boolean",
          },
          {
              stack: [
                  "CallExpression",
                  "ObjectLiteralExpression",
                  "PropertyAssignment",
                  "ObjectLiteralExpression",
                  "PropertyAssignment",
                  "PropertyAccessExpression",
                  "Identifier",
                  "BindingElement",
                  "ArrayLiteralExpression",
                  "ObjectLiteralExpression",
                  "PropertyAssignment",
                  "ObjectLiteralExpression",
              ],
              type: "map",
              node: "ObjectLiteralExpression",
              value: {
                  warning: [
                      {
                          stack: [
                              "CallExpression",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "PropertyAccessExpression",
                              "Identifier",
                              "BindingElement",
                              "ArrayLiteralExpression",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "ObjectLiteralExpression",
                              "PropertyAssignment",
                              "StringLiteral",
                          ],
                          type: "literal",
                          node: "StringLiteral",
                          value: "var(--backgroundColor-warning__1dghp00t)",
                          kind: "string",
                      },
                  ],
              },
          },
          {
              stack: [
                  "CallExpression",
                  "ObjectLiteralExpression",
                  "PropertyAssignment",
                  "ObjectLiteralExpression",
                  "PropertyAssignment",
                  "PropertyAccessExpression",
                  "Identifier",
                  "BindingElement",
                  "ArrayLiteralExpression",
                  "ObjectLiteralExpression",
                  "PropertyAssignment",
                  "ObjectLiteralExpression",
                  "PropertyAssignment",
                  "StringLiteral",
              ],
              type: "literal",
              node: "StringLiteral",
              value: "var(--backgroundColor-warning__1dghp00t)",
              kind: "string",
          },
      ]
    `);
});
