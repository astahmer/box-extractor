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
                          color: {
                              main: "#d2a8ff",
                              secondary: "#7ee787",
                              brand: "red",
                              other: "blue",
                          },
                      },
                  ],
                  ["shorthands", {}],
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
                                  },
                              ],
                              tablet: [
                                  {
                                      type: "object",
                                      value: {
                                          "@media": "(min-width: 768px)",
                                      },
                                  },
                              ],
                              desktop: [
                                  {
                                      type: "object",
                                      value: {
                                          "@media": "(min-width: 1024px)",
                                      },
                                  },
                              ],
                              idle: [
                                  {
                                      type: "map",
                                      value: {},
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
                                              },
                                          ],
                                      },
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
                                              },
                                          ],
                                      },
                                  },
                              ],
                          },
                      },
                  ],
                  defaultCondition: [
                      {
                          type: "literal",
                          value: "idle",
                      },
                  ],
                  properties: [
                      {
                          type: "map",
                          value: {
                              color: [
                                  {
                                      type: "map",
                                      value: {
                                          main: [
                                              {
                                                  type: "literal",
                                                  value: "#d2a8ff",
                                              },
                                          ],
                                          secondary: [
                                              {
                                                  type: "literal",
                                                  value: "#7ee787",
                                              },
                                          ],
                                          brand: [
                                              {
                                                  type: "literal",
                                                  value: "red",
                                              },
                                          ],
                                          other: [
                                              {
                                                  type: "literal",
                                                  value: "blue",
                                              },
                                          ],
                                      },
                                  },
                              ],
                          },
                      },
                  ],
                  shorthands: [
                      {
                          type: "map",
                          value: {},
                      },
                  ],
              },
          ],
      ]
    `
    );
});
