import { Project, SourceFile, ts } from "ts-morph";
import { afterEach, expect, it } from "vitest";
import { extract } from "../src/extractor/extract";
import { getBoxLiteralValue } from "../src/extractor/getBoxLiteralValue";
import type { ExtractOptions, BoxNodesMap } from "../src/extractor/types";
import * as path from "node:path";

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
        tsConfigFilePath: path.resolve(__dirname, "./sample-files-split/tsconfig.json"),
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
    // console.log(sourceFile.forEachDescendant((c) => [c.getKindName(), c.getText()]));
    const extracted = extract({ ast: sourceFile, extractMap, ...options });
    // console.dir({ test: true, usedMap, extracted }, { depth: null });
    return Array.from(extracted.entries()).map(([name, props]) => [
        name,
        Array.from(props.nodesByProp.entries()).map(([propName, propValues]) => [
            propName,
            getBoxLiteralValue(propValues),
        ]),
        extractMap.get(name)!.nodesByProp,
    ]);
};

it("extract example.css.ts defineProperties arg result", () => {
    const sourceFile = project.addSourceFileAtPath(path.resolve(__dirname, "./sample-files-split/example.css.ts"));

    expect(extractFromCode(sourceFile, { functions: ["defineProperties"] })).toMatchInlineSnapshot(
        `
      [
          [
              "defineProperties",
              [
                  [
                      "conditions",
                      {
                          mobile: {
                              "@media": "(min-width: 320px)",
                          },
                          tablet: {
                              "@media": "(min-width: 768px)",
                          },
                          desktop: {
                              "@media": "(min-width: 1024px)",
                          },
                          idle: {},
                          focus: {
                              selector: "&:focus",
                          },
                          hover: {
                              selector: "&:hover",
                          },
                      },
                  ],
                  ["defaultCondition", "idle"],
                  [
                      "properties",
                      {
                          position: ["relative", "absolute"],
                          display: ["block", "inline-block", "flex", "inline-flex"],
                          color: {
                              main: "#d2a8ff",
                              secondary: "#7ee787",
                              brand: "red",
                              other: "blue",
                          },
                      },
                  ],
                  [
                      "shorthands",
                      {
                          p: ["position"],
                          d: ["display"],
                      },
                  ],
              ],
              {
                  conditions: [
                      {
                          type: "map",
                          value: {
                              mobile: [
                                  {
                                      type: "object",
                                      value: {
                                          "@media": "(min-width: 320px)",
                                      },
                                      getNode: "CallExpression",
                                  },
                              ],
                              tablet: [
                                  {
                                      type: "object",
                                      value: {
                                          "@media": "(min-width: 768px)",
                                      },
                                      getNode: "CallExpression",
                                  },
                              ],
                              desktop: [
                                  {
                                      type: "object",
                                      value: {
                                          "@media": "(min-width: 1024px)",
                                      },
                                      getNode: "CallExpression",
                                  },
                              ],
                              idle: [
                                  {
                                      type: "map",
                                      value: {},
                                      getNode: "ObjectLiteralExpression",
                                  },
                              ],
                              focus: [
                                  {
                                      type: "map",
                                      value: {
                                          selector: [
                                              {
                                                  type: "literal",
                                                  value: "&:focus",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                          ],
                                      },
                                      getNode: "ObjectLiteralExpression",
                                  },
                              ],
                              hover: [
                                  {
                                      type: "map",
                                      value: {
                                          selector: [
                                              {
                                                  type: "literal",
                                                  value: "&:hover",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                          ],
                                      },
                                      getNode: "ObjectLiteralExpression",
                                  },
                              ],
                          },
                          getNode: "ObjectLiteralExpression",
                          fromNode: "CallExpression",
                      },
                  ],
                  defaultCondition: [
                      {
                          type: "literal",
                          value: "idle",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "CallExpression",
                      },
                  ],
                  properties: [
                      {
                          type: "map",
                          value: {
                              position: [
                                  {
                                      type: "list",
                                      value: [
                                          {
                                              type: "literal",
                                              value: "relative",
                                              kind: "string",
                                              getNode: "StringLiteral",
                                          },
                                          {
                                              type: "literal",
                                              value: "absolute",
                                              kind: "string",
                                              getNode: "StringLiteral",
                                          },
                                      ],
                                      getNode: "ArrayLiteralExpression",
                                  },
                              ],
                              display: [
                                  {
                                      type: "list",
                                      value: [
                                          {
                                              type: "literal",
                                              value: "block",
                                              kind: "string",
                                              getNode: "StringLiteral",
                                          },
                                          {
                                              type: "literal",
                                              value: "inline-block",
                                              kind: "string",
                                              getNode: "StringLiteral",
                                          },
                                          {
                                              type: "literal",
                                              value: "flex",
                                              kind: "string",
                                              getNode: "StringLiteral",
                                          },
                                          {
                                              type: "literal",
                                              value: "inline-flex",
                                              kind: "string",
                                              getNode: "StringLiteral",
                                          },
                                      ],
                                      getNode: "ArrayLiteralExpression",
                                  },
                              ],
                              color: [
                                  {
                                      type: "map",
                                      value: {
                                          main: [
                                              {
                                                  type: "literal",
                                                  value: "#d2a8ff",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                          ],
                                          secondary: [
                                              {
                                                  type: "literal",
                                                  value: "#7ee787",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                          ],
                                          brand: [
                                              {
                                                  type: "literal",
                                                  value: "red",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                          ],
                                          other: [
                                              {
                                                  type: "literal",
                                                  value: "blue",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                          ],
                                      },
                                      getNode: "ObjectLiteralExpression",
                                  },
                              ],
                          },
                          getNode: "ObjectLiteralExpression",
                          fromNode: "CallExpression",
                      },
                  ],
                  shorthands: [
                      {
                          type: "map",
                          value: {
                              p: [
                                  {
                                      type: "list",
                                      value: [
                                          {
                                              type: "literal",
                                              value: "position",
                                              kind: "string",
                                              getNode: "StringLiteral",
                                          },
                                      ],
                                      getNode: "ArrayLiteralExpression",
                                  },
                              ],
                              d: [
                                  {
                                      type: "list",
                                      value: [
                                          {
                                              type: "literal",
                                              value: "display",
                                              kind: "string",
                                              getNode: "StringLiteral",
                                          },
                                      ],
                                      getNode: "ArrayLiteralExpression",
                                  },
                              ],
                          },
                          getNode: "ObjectLiteralExpression",
                          fromNode: "CallExpression",
                      },
                  ],
              },
          ],
      ]
    `
    );
});
