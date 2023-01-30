import { Project, SourceFile, ts } from "ts-morph";
import { afterEach, expect, it } from "vitest";
import { extract } from "../src/extractor/extract";
import { getBoxLiteralValue } from "../src/extractor/getBoxLiteralValue";
import type { ExtractOptions, BoxNodesMap, FunctionNodesMap } from "../src/extractor/types";
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

const config: ExtractOptions["components"] = {
    ColorBox: {
        properties: ["color", "backgroundColor", "zIndex", "fontSize", "display", "mobile", "tablet", "desktop", "css"],
    },
};
const getExtract = (code: string, options: Omit<ExtractOptions, "ast">) => {
    const fileName = `file${fileCount++}.tsx`;
    sourceFile = project.createSourceFile(fileName, code, { scriptKind: ts.ScriptKind.TSX });
    return extract({ ast: sourceFile, components: config, ...options });
};

const extractFromCode = (code: string, options?: Partial<ExtractOptions>) => {
    const extractMap = options?.extractMap ?? (new Map() as BoxNodesMap);
    const fileName = `file${fileCount++}.tsx`;
    sourceFile = project.createSourceFile(fileName, code, { scriptKind: ts.ScriptKind.TSX });
    // console.log(sourceFile.forEachDescendant((c) => [c.getKindName(), c.getText()]));
    const extracted = extract({ ast: sourceFile, components: config, extractMap, ...options });
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

it("extract it all", () => {
    expect(extractFromCode(ExtractSample)).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      [
                          "red.200",
                          "yellow.300",
                          ["cyan.400", "cyan.500"],
                          "facebook.400",
                          "gray.100",
                          "facebook.500",
                          ["facebook.600", "gray.200"],
                          ["gray.200", "gray.300"],
                          "gray.100",
                          "facebook.900",
                          "facebook.900",
                          "pink.100",
                          "pink.100",
                          "pink.100",
                          "pink.100",
                          "pink.100",
                          "facebook.900",
                          "facebook.900",
                          "facebook.900",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          "gray.100",
                          ["gray.600", "gray.800"],
                          ["gray.700", "gray.100"],
                          "gray.100",
                          {
                              default: "red.100",
                              hover: "green.100",
                              focus: "blue.100",
                          },
                          "facebook.900",
                          "facebook.900",
                          "facebook.900",
                          "red.100",
                          "red.100",
                          "green.100",
                          "blue.100",
                          "yellow.100",
                          "orange.100",
                          "orange.300",
                          "red.100",
                          "orange.400",
                          "facebook.100",
                          "blackAlpha.400",
                          "blackAlpha.400",
                          "facebook.200",
                          "facebook.200",
                          "twitter.100",
                          "orange.100",
                          "orange.200",
                          "orange.400",
                          "telegram.300",
                      ],
                  ],
                  [
                      "backgroundColor",
                      [
                          "blackAlpha.100",
                          {
                              default: "orange.800",
                              hover: "telegram.200",
                              focus: "yellow.700",
                          },
                          "blackAlpha.100",
                          "twitter.200",
                          "twitter.200",
                          "twitter.200",
                          "telegram.400",
                      ],
                  ],
              ],
              {
                  color: [
                      {
                          type: "literal",
                          value: "red.200",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "yellow.300",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "conditional",
                          whenTrue: {
                              type: "literal",
                              value: "cyan.400",
                              kind: "string",
                              getNode: "StringLiteral",
                          },
                          whenFalse: {
                              type: "literal",
                              value: "cyan.500",
                              kind: "string",
                              getNode: "StringLiteral",
                          },
                          kind: "ternary",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "facebook.400",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "gray.100",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "facebook.500",
                          kind: "string",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "conditional",
                          whenTrue: {
                              type: "literal",
                              value: "facebook.600",
                              kind: "string",
                              getNode: "StringLiteral",
                          },
                          whenFalse: {
                              type: "literal",
                              value: "gray.200",
                              kind: "string",
                              getNode: "StringLiteral",
                          },
                          kind: "ternary",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "conditional",
                          whenTrue: {
                              type: "literal",
                              value: "gray.200",
                              kind: "string",
                              getNode: "StringLiteral",
                          },
                          whenFalse: {
                              type: "literal",
                              value: "gray.300",
                              kind: "string",
                              getNode: "StringLiteral",
                          },
                          kind: "ternary",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "gray.100",
                          kind: "string",
                          getNode: "PropertyAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "facebook.900",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "facebook.900",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "pink.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "pink.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "pink.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "pink.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "pink.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "facebook.900",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "facebook.900",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "facebook.900",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "gray.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "gray.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "gray.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "gray.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "gray.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "gray.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "gray.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "gray.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "gray.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "gray.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "gray.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "conditional",
                          whenTrue: {
                              type: "literal",
                              value: "gray.600",
                              kind: "string",
                              getNode: "StringLiteral",
                          },
                          whenFalse: {
                              type: "literal",
                              value: "gray.800",
                              kind: "string",
                              getNode: "StringLiteral",
                          },
                          kind: "ternary",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "conditional",
                          whenTrue: {
                              type: "literal",
                              value: "gray.700",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                          },
                          whenFalse: {
                              type: "literal",
                              value: "gray.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                          },
                          kind: "ternary",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "gray.100",
                          kind: "string",
                          getNode: "PropertyAccessExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "map",
                          value: {
                              default: [
                                  {
                                      type: "literal",
                                      value: "red.100",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                              hover: [
                                  {
                                      type: "literal",
                                      value: "green.100",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                              focus: [
                                  {
                                      type: "literal",
                                      value: "blue.100",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                          },
                          getNode: "ObjectLiteralExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "facebook.900",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "facebook.900",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "facebook.900",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "red.100",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "red.100",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "green.100",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "blue.100",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "yellow.100",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "orange.100",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "orange.300",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "red.100",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "orange.400",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "facebook.100",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                      {
                          type: "literal",
                          value: "blackAlpha.400",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                      {
                          type: "literal",
                          value: "blackAlpha.400",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                      {
                          type: "literal",
                          value: "facebook.200",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                      {
                          type: "literal",
                          value: "facebook.200",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                      {
                          type: "literal",
                          value: "twitter.100",
                          kind: "string",
                          getNode: "CallExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                      {
                          type: "literal",
                          value: "orange.100",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                      {
                          type: "literal",
                          value: "orange.200",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                      {
                          type: "literal",
                          value: "orange.400",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                      {
                          type: "literal",
                          value: "telegram.300",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
                  backgroundColor: [
                      {
                          type: "literal",
                          value: "blackAlpha.100",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "map",
                          value: {
                              default: [
                                  {
                                      type: "literal",
                                      value: "orange.800",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                              hover: [
                                  {
                                      type: "literal",
                                      value: "telegram.200",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                              focus: [
                                  {
                                      type: "literal",
                                      value: "yellow.700",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                          },
                          getNode: "ObjectLiteralExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "blackAlpha.100",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                      {
                          type: "literal",
                          value: "twitter.200",
                          kind: "string",
                          getNode: "CallExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                      {
                          type: "literal",
                          value: "twitter.200",
                          kind: "string",
                          getNode: "CallExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                      {
                          type: "literal",
                          value: "twitter.200",
                          kind: "string",
                          getNode: "CallExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                      {
                          type: "literal",
                          value: "telegram.400",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > StringLiteral (multiple)", () => {
    expect(extractFromCode(`<ColorBox color="red.200" backgroundColor="blackAlpha.100"></ColorBox>`))
        .toMatchInlineSnapshot(`
          [
              [
                  "ColorBox",
                  [
                      ["color", "red.200"],
                      ["backgroundColor", "blackAlpha.100"],
                  ],
                  {
                      color: [
                          {
                              type: "literal",
                              value: "red.200",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                      backgroundColor: [
                          {
                              type: "literal",
                              value: "blackAlpha.100",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              ],
          ]
        `);
});

it("minimal - groups extract props in parent component instance", () => {
    const extracted = getExtract(
        `
    <ColorBox color="red.200" />
    <ColorBox color="yellow.300" backgroundColor="blackAlpha.100" {...{ display: "flex", color: "blue.100" }}>
    children
</ColorBox>
    `,
        { components: ["ColorBox"] }
    );
    expect(extracted.get("ColorBox")!.queryList).toMatchInlineSnapshot(`
      [
          {
              name: "ColorBox",
              fromNode: "JsxSelfClosingElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "red.200",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "yellow.300",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
                  backgroundColor: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "blackAlpha.100",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
                  _SPREAD_2: {
                      type: "spread",
                      map: {
                          display: [
                              {
                                  type: "literal",
                                  value: "flex",
                                  kind: "string",
                                  getNode: "StringLiteral",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                          color: [
                              {
                                  type: "literal",
                                  value: "blue.100",
                                  kind: "string",
                                  getNode: "StringLiteral",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                      },
                  },
              },
          },
      ]
    `);
});

it("ExtractSample - groups extract props in parent component instance", () => {
    const extracted = getExtract(ExtractSample, { components: ["ColorBox"] });
    expect(extracted.get("ColorBox")!.queryList).toMatchInlineSnapshot(`
      [
          {
              name: "ColorBox",
              fromNode: "JsxSelfClosingElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "red.200",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "yellow.300",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
                  backgroundColor: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "blackAlpha.100",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "conditional",
                              whenTrue: {
                                  type: "literal",
                                  value: "cyan.400",
                                  kind: "string",
                                  getNode: "StringLiteral",
                              },
                              whenFalse: {
                                  type: "literal",
                                  value: "cyan.500",
                                  kind: "string",
                                  getNode: "StringLiteral",
                              },
                              kind: "ternary",
                              getNode: "ConditionalExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "facebook.400",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "gray.100",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "facebook.500",
                              kind: "string",
                              getNode: "ConditionalExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "conditional",
                              whenTrue: {
                                  type: "literal",
                                  value: "facebook.600",
                                  kind: "string",
                                  getNode: "StringLiteral",
                              },
                              whenFalse: {
                                  type: "literal",
                                  value: "gray.200",
                                  kind: "string",
                                  getNode: "StringLiteral",
                              },
                              kind: "ternary",
                              getNode: "ConditionalExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "conditional",
                              whenTrue: {
                                  type: "literal",
                                  value: "gray.200",
                                  kind: "string",
                                  getNode: "StringLiteral",
                              },
                              whenFalse: {
                                  type: "literal",
                                  value: "gray.300",
                                  kind: "string",
                                  getNode: "StringLiteral",
                              },
                              kind: "ternary",
                              getNode: "ConditionalExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "gray.100",
                              kind: "string",
                              getNode: "PropertyAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "facebook.900",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "facebook.900",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "pink.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "pink.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "pink.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "pink.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "pink.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "facebook.900",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "facebook.900",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "facebook.900",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "gray.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "gray.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "gray.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "gray.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "gray.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "gray.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "gray.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "gray.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "gray.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "gray.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "gray.100",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "conditional",
                              whenTrue: {
                                  type: "literal",
                                  value: "gray.600",
                                  kind: "string",
                                  getNode: "StringLiteral",
                              },
                              whenFalse: {
                                  type: "literal",
                                  value: "gray.800",
                                  kind: "string",
                                  getNode: "StringLiteral",
                              },
                              kind: "ternary",
                              getNode: "ConditionalExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "conditional",
                              whenTrue: {
                                  type: "literal",
                                  value: "gray.700",
                                  kind: "string",
                                  getNode: "ElementAccessExpression",
                              },
                              whenFalse: {
                                  type: "literal",
                                  value: "gray.100",
                                  kind: "string",
                                  getNode: "ElementAccessExpression",
                              },
                              kind: "ternary",
                              getNode: "ConditionalExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "gray.100",
                              kind: "string",
                              getNode: "PropertyAccessExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "map",
                              value: {
                                  default: [
                                      {
                                          type: "literal",
                                          value: "red.100",
                                          kind: "string",
                                          getNode: "StringLiteral",
                                      },
                                  ],
                                  hover: [
                                      {
                                          type: "literal",
                                          value: "green.100",
                                          kind: "string",
                                          getNode: "StringLiteral",
                                      },
                                  ],
                                  focus: [
                                      {
                                          type: "literal",
                                          value: "blue.100",
                                          kind: "string",
                                          getNode: "StringLiteral",
                                      },
                                  ],
                              },
                              getNode: "ObjectLiteralExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  backgroundColor: {
                      type: "prop",
                      nodes: [
                          {
                              type: "map",
                              value: {
                                  default: [
                                      {
                                          type: "literal",
                                          value: "orange.800",
                                          kind: "string",
                                          getNode: "StringLiteral",
                                      },
                                  ],
                                  hover: [
                                      {
                                          type: "literal",
                                          value: "telegram.200",
                                          kind: "string",
                                          getNode: "StringLiteral",
                                      },
                                  ],
                                  focus: [
                                      {
                                          type: "literal",
                                          value: "yellow.700",
                                          kind: "string",
                                          getNode: "StringLiteral",
                                      },
                                  ],
                              },
                              getNode: "ObjectLiteralExpression",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "facebook.900",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
                  _SPREAD_1: {
                      type: "spread",
                      map: {},
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "facebook.900",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
                  _SPREAD_1: {
                      type: "spread",
                      map: {},
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "facebook.900",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "red.100",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
                  _SPREAD_1: {
                      type: "spread",
                      map: {},
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "red.100",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
                  _SPREAD_1: {
                      type: "spread",
                      map: {},
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxSelfClosingElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "green.100",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
                  _SPREAD_1: {
                      type: "spread",
                      map: {},
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxSelfClosingElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "blue.100",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
                  _SPREAD_1: {
                      type: "spread",
                      map: {},
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxSelfClosingElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "yellow.100",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
                  _SPREAD_1: {
                      type: "spread",
                      map: {},
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxSelfClosingElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "orange.100",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
                  _SPREAD_1: {
                      type: "spread",
                      map: {},
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxSelfClosingElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "orange.300",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
                  _SPREAD_1: {
                      type: "spread",
                      map: {},
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxSelfClosingElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "red.100",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
                  _SPREAD_1: {
                      type: "spread",
                      map: {},
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxSelfClosingElement",
              props: {
                  color: {
                      type: "prop",
                      nodes: [
                          {
                              type: "literal",
                              value: "orange.400",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "Identifier",
                          },
                      ],
                  },
                  _SPREAD_1: {
                      type: "spread",
                      map: {},
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  _SPREAD_0: {
                      type: "spread",
                      map: {
                          color: [
                              {
                                  type: "literal",
                                  value: "facebook.100",
                                  kind: "string",
                                  getNode: "StringLiteral",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  _SPREAD_0: {
                      type: "spread",
                      map: {
                          color: [
                              {
                                  type: "literal",
                                  value: "blackAlpha.400",
                                  kind: "string",
                                  getNode: "StringLiteral",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  _SPREAD_0: {
                      type: "spread",
                      map: {
                          color: [
                              {
                                  type: "literal",
                                  value: "blackAlpha.400",
                                  kind: "string",
                                  getNode: "StringLiteral",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  _SPREAD_0: {
                      type: "spread",
                      map: {
                          color: [
                              {
                                  type: "literal",
                                  value: "facebook.200",
                                  kind: "string",
                                  getNode: "StringLiteral",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                          backgroundColor: [
                              {
                                  type: "literal",
                                  value: "blackAlpha.100",
                                  kind: "string",
                                  getNode: "StringLiteral",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                          borderColor: [
                              {
                                  type: "literal",
                                  value: "blackAlpha.300",
                                  kind: "string",
                                  getNode: "StringLiteral",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  _SPREAD_0: {
                      type: "spread",
                      map: {
                          color: [
                              {
                                  type: "literal",
                                  value: "facebook.200",
                                  kind: "string",
                                  getNode: "StringLiteral",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  _SPREAD_0: {
                      type: "spread",
                      map: {},
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  _SPREAD_0: {
                      type: "spread",
                      map: {
                          color: [
                              {
                                  type: "literal",
                                  value: "twitter.100",
                                  kind: "string",
                                  getNode: "CallExpression",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                          backgroundColor: [
                              {
                                  type: "literal",
                                  value: "twitter.200",
                                  kind: "string",
                                  getNode: "CallExpression",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  _SPREAD_0: {
                      type: "spread",
                      map: {
                          backgroundColor: [
                              {
                                  type: "literal",
                                  value: "twitter.200",
                                  kind: "string",
                                  getNode: "CallExpression",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                          color: [
                              {
                                  type: "literal",
                                  value: "orange.100",
                                  kind: "string",
                                  getNode: "StringLiteral",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  _SPREAD_0: {
                      type: "spread",
                      map: {
                          backgroundColor: [
                              {
                                  type: "literal",
                                  value: "twitter.200",
                                  kind: "string",
                                  getNode: "CallExpression",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                          color: [
                              {
                                  type: "literal",
                                  value: "orange.200",
                                  kind: "string",
                                  getNode: "StringLiteral",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  _SPREAD_0: {
                      type: "spread",
                      map: {
                          color: [
                              {
                                  type: "literal",
                                  value: "orange.400",
                                  kind: "string",
                                  getNode: "StringLiteral",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                      },
                  },
              },
          },
          {
              name: "ColorBox",
              fromNode: "JsxOpeningElement",
              props: {
                  _SPREAD_0: {
                      type: "spread",
                      map: {
                          color: [
                              {
                                  type: "literal",
                                  value: "telegram.300",
                                  kind: "string",
                                  getNode: "StringLiteral",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                          backgroundColor: [
                              {
                                  type: "literal",
                                  value: "telegram.400",
                                  kind: "string",
                                  getNode: "StringLiteral",
                                  fromNode: "JsxSpreadAttribute",
                              },
                          ],
                      },
                  },
              },
          },
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > StringLiteral", () => {
    expect(extractFromCode(`<ColorBox color={"red.300"}></ColorBox>`)).toMatchInlineSnapshot(
        `
      [
          [
              "ColorBox",
              [["color", "red.300"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "red.300",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `
    );
});

it("extract JsxAttribute > JsxExpression > Identifier", () => {
    expect(
        extractFromCode(`
            const color = "red.400";
            <ColorBox color={color}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.400"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "red.400",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ConditonalExpression > Identifier|Value", () => {
    expect(
        extractFromCode(`
            const darkValue = "red.500";
            <ColorBox color={isDark ? darkValue : "whiteAlpha.100"}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", ["red.500", "whiteAlpha.100"]]],
              {
                  color: [
                      {
                          type: "conditional",
                          whenTrue: {
                              type: "literal",
                              value: "red.500",
                              kind: "string",
                              getNode: "StringLiteral",
                          },
                          whenFalse: {
                              type: "literal",
                              value: "whiteAlpha.100",
                              kind: "string",
                              getNode: "StringLiteral",
                          },
                          kind: "ternary",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                red: "red.600",
            } as const;
            <ColorBox color={colorMap["red"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.600"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "red.600",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression without as const", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                red: "red.600",
            };
            <ColorBox color={colorMap["red"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.600"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "red.600",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression optional", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                red: "red.700",
            } as const;
            <ColorBox color={colorMap?.["red"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.700"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "red.700",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression optional without as const", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                red: "red.700",
            };
            <ColorBox color={colorMap?.["red"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.700"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "red.700",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > Identifier", () => {
    expect(
        extractFromCode(`
            const propName = "red";
            const colorMap = {
                red: "red.800",
            } as const;
            <ColorBox color={colorMap[propName]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.800"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "red.800",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > Identifier without as const", () => {
    expect(
        extractFromCode(`
            const propName = "red";
            const colorMap = {
                red: "red.800",
            };
            <ColorBox color={colorMap[propName]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.800"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "red.800",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > StringLiteral on map with ComputedProperty name", () => {
    expect(
        extractFromCode(`
            const propName = "red";
            const colorMap = {
                [propName]: "red.900",
            } as const;
            <ColorBox color={colorMap["red"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.900"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "red.900",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > StringLiteral on map with ComputedProperty name without  as const", () => {
    expect(
        extractFromCode(`
            const propName = "red";
            const colorMap = {
                [propName]: "red.900",
            };
            <ColorBox color={colorMap["red"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "red.900"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "red.900",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ComputedProperty name", () => {
    expect(
        extractFromCode(`
            const propName = "blue";
            const colorMap = {
                [propName]: "blue.100",
            } as const;
            <ColorBox color={colorMap[propName]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.100"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "blue.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ComputedProperty name without as const", () => {
    expect(
        extractFromCode(`
            const propName = "blue";
            const colorMap = {
                [propName]: "blue.100",
            };
            <ColorBox color={colorMap[propName]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.100"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "blue.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > PropertyAccessExpression", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                blue: "blue.200",
            } as const;
            <ColorBox color={colorMap.blue}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.200"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "blue.200",
                          kind: "string",
                          getNode: "PropertyAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > PropertyAccessExpression optional", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                blue: "blue.300",
            } as const;
            <ColorBox color={colorMap?.blue}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.300"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "blue.300",
                          kind: "string",
                          getNode: "PropertyAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > PropertyAccessExpression optional without as const", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                blue: "blue.300",
            };
            <ColorBox color={colorMap?.blue}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.300"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "blue.300",
                          kind: "string",
                          getNode: "PropertyAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                longProp: "blue.400",
            } as const;
            <ColorBox color={colorMap["long" + "Prop"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.400"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "blue.400",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral without as const", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                longProp: "blue.400",
            };
            <ColorBox color={colorMap["long" + "Prop"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.400"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "blue.400",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral + Identifier without as const", () => {
    expect(
        extractFromCode(`
            const part2 = "Prop";
            const colorMap = {
                longProp: "blue.500",
            };
            <ColorBox color={colorMap["long" + part2]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.500"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "blue.500",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > NoSubstitionTemplateLiteral", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                longProp: "blue.600",
            } as const;
            <ColorBox color={colorMap[\`longProp\`]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.600"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "blue.600",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > NoSubstitionTemplateLiteral without as const", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                longProp: "blue.600",
            };
            <ColorBox color={colorMap[\`longProp\`]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.600"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "blue.600",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > TemplateStringLiteral & Identifier", () => {
    expect(
        extractFromCode(`
            const part2 = "Prop" as const;
            const colorMap = {
                longProp: "blue.700",
            } as const;
            <ColorBox color={colorMap[\`long\${part2}\`]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.700"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "blue.700",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > TemplateStringLiteral > Identifier x2", () => {
    expect(
        extractFromCode(`
            const part1 = "long" as const;
            const part2 = "Prop" as const;
            const colorMap = {
                longProp: "blue.800",
            } as const;
            <ColorBox color={colorMap[\`$\{part1}\${part2}\`]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.800"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "blue.800",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ConditonalExpression > AsExpression (StringLiteral) + Identifier", () => {
    expect(
        extractFromCode(`
            const isDark = true;
            const lightRef = "light" as const;
            const colorMap = {
                dark: "blue.900",
                light: "blue.900",
            } as const;
            <ColorBox color={colorMap[isDark ? ("dark" as const) : lightRef]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "blue.900"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "blue.900",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > TemplateStringLiteral + Identifier (StringLiteral)", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                longProp: "green.100",
            } as const;
            <ColorBox color={colorMap["long" + \`\${"Prop"}\`]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.100"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "green.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral + TemplateStringLiteral > ElementAccessExpression > Identifier (StringLiteral)", () => {
    expect(
        extractFromCode(`
            const dynamic = {
                part2: "Prop",
            } as const;
            const colorMap = {
                longProp: "green.200",
            } as const;
            <ColorBox color={colorMap[("long" as any) + (\`\${dynamic["part2"]}\`) as any]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.200"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "green.200",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > PropertyAccessExpression + ElementAccessExpression > Identifier", () => {
    expect(
        extractFromCode(`
            const part2ref = "part2" as const;
            const dynamic = {
                part1: "long",
                part2: "Prop",
            } as const;
            const colorMap = {
                longProp: "green.300",
            } as const;
            <ColorBox color={colorMap[dynamic.part1 + dynamic[part2ref]]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.300"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "green.300",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ObjectLiteralExpression", () => {
    expect(
        extractFromCode(`
            <ColorBox color={{ staticColor: "green.400" }["staticColor"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.400"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "green.400",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression (AsExpression) > Identifier (StringLiteral) x2", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                longProp: "green.500",
            };
            <ColorBox color={colorMap["long" + "Prop"] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.500"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "green.500",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression (AsExpression) > Identifier (StringLiteral) x2 on ShorthandPropertyAssignment", () => {
    expect(
        extractFromCode(`
            const longProp = "green.600"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap["long" + "Prop"] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.600"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "green.600",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > StringLiteral (AsExpression) + TemplateStringLiteral > Identifier (StringLiteral) (AsExpression)", () => {
    expect(
        extractFromCode(`
            const dynamicPart2 = "Prop";
            const withDynamicPart = {
                dynamicPart2: dynamicPart2,
            };
            const longProp = "green.700"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap[("long" as any) + \`\${withDynamicPart["dynamicPart2"]}\`] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.700"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "green.700",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ElementAccessExpression > Identifier > Identifier", () => {
    expect(
        extractFromCode(`
            const dynamicElement = "longProp";
            const secondRef = "secondLevel";
            const wrapperMap = {
                [secondRef]: dynamicElement,
            };
            const longProp = "green.800"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap[wrapperMap[secondRef]]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.800"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "green.800",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > NumericLiteral", () => {
    expect(
        extractFromCode(`
            <ColorBox color={["green.900"][0]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "green.900"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "green.900",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > StringLiteral", () => {
    expect(
        extractFromCode(`
            <ColorBox color={["pink.100"]["0"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.100"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "pink.100",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > Identifier > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const nbIndex = 1;
            <ColorBox color={["pink.100", "pink.200"][nbIndex]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.200"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "pink.200",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ArrayLiteralExpression > Identifier > StringLiteral", () => {
    expect(
        extractFromCode(`
            const strIndex = "0";
            <ColorBox color={["pink.300"][strIndex]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.300"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "pink.300",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ParenthesizedExpression > AsExpression > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const array = ["pink.400"];
            <ColorBox color={(array as any)?.[0] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.400"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "pink.400",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ArrayLiteralExpression > ElementAccessExpression > NonNullExpression > ElementAccessExpression > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const array = ["pink.500"];
            <ColorBox color={[array[0]]![0]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.500"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "pink.500",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ElementAccessExpression > ArrayLiteralExpression > ObjectLiteralExpresssion > PropertyAssignment > StringLiteral", () => {
    expect(
        extractFromCode(`
            <ColorBox color={[{ staticColor: "pink.600" }][0]["staticColor"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.600"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "pink.600",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression", () => {
    expect(
        extractFromCode(`
            const isShown = true;
            const dynamicColorName = "something";
            const nestedReference = { ref: dynamicColorName } as const;
            const deepReference = nestedReference.ref;

            const colorMap = {
                literalColor: "pink.700",
                [deepReference]: "pink.800",
            };

            <ColorBox color={colorMap[!isShown ? ("literalColor" as const) : deepReference] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.800"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "pink.800",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > TemplateExpression > Identifier > TemplateExpression", () => {
    expect(
        extractFromCode(`
            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";
            const dynamicPartsAsTemplateString = \`\${dynamicPart1}\${dynamicPart2}\` as const;

            const longProp = "pink.900"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap[\`\${dynamicPartsAsTemplateString}\`] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.900"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "pink.900",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > TemplateExpression > Identifier > TemplateExpression without as const", () => {
    expect(
        extractFromCode(`
            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";
            const dynamicPartsAsTemplateString = \`\${dynamicPart1}\${dynamicPart2}\`;

            const longProp = "pink.900"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap[\`\${dynamicPartsAsTemplateString}\`] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "pink.900"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "pink.900",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > BinaryExpression > PropertyAccessExpression + ElementAccessExpression", () => {
    expect(
        extractFromCode(`
            const dynamicElement = "longProp";
            const secondRef = "secondLevel";

            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";
            const withDynamicPart = {
                dynamicPart1,
                dynamicPart2: dynamicPart2,
            };

            const wrapperMap = {
                [secondRef]: dynamicElement,
                thirdRef: withDynamicPart.dynamicPart1,
                fourthRef: withDynamicPart["dynamicPart2"],
            };
            const longProp = "yellow.100"
            const colorMap = {
                longProp,
            };
            <ColorBox color={colorMap[wrapperMap.thirdRef + wrapperMap["fourthRef"]]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "yellow.100"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "yellow.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression evaluate (first when true is right)", () => {
    expect(
        extractFromCode(`
            const isShown = true;
            const dynamicColorName = "something";
            const nestedReference = { ref: dynamicColorName } as const;
            const deepReference = nestedReference.ref;

            const colorMap = {
                literalColor: "yellow.200",
                [deepReference]: "yellow.300",
                refToAnother: "another",
                another: "yellow.400",
            };

            <ColorBox color={colorMap[isShown ? ("literalColor" as const) : (false ? "yellow.never" : 1 === 1 ? colorMap["refToAnother"] : deepReference)] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "yellow.200"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "yellow.200",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression evaluate (second when true is right)", () => {
    expect(
        extractFromCode(`
            const dynamicColorName = "something";
            const nestedReference = { ref: dynamicColorName } as const;
            const deepReference = nestedReference.ref;

            const colorMap = {
                literalColor: "yellow.200",
                [deepReference]: "yellow.300",
                refToAnother: "another",
                another: "yellow.500",
            };

            <ColorBox color={colorMap[(false ? "yellow.never" : 1 === 1 ? colorMap["refToAnother"] : deepReference)] as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "yellow.500"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "yellow.500",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > CallExpression > ArrowFunction > Identifier (StringLiteral)", () => {
    expect(
        extractFromCode(`
            const getColor = () => "yellow.600";

            <ColorBox color={getColor()}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "yellow.600"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "yellow.600",
                          kind: "string",
                          getNode: "CallExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > CallExpression > FunctionDeclaration > Identifier (StringLiteral)", () => {
    expect(
        extractFromCode(`
            function getColor() {
                return "yellow.700";
            }

            <ColorBox color={getColor()}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "yellow.700"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "yellow.700",
                          kind: "string",
                          getNode: "CallExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > CallExpression with Parameter > ElementAccessExpression > ArrayLiteralExpression > StringLiteral", () => {
    expect(
        extractFromCode(`
            const pickSecondElement = (arr: string[]) => arr[1];
            const array = ["yellow.800", "yellow.900"];

            <ColorBox color={pickSecondElement(array)}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "yellow.900"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "yellow.900",
                          kind: "string",
                          getNode: "CallExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > CallExpression with non-deterministic results > should returns nothing", () => {
    expect(
        extractFromCode(`
            const pickRandom = <T = any>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
            const array = ["purple.never1", "purple.alsoNever"];

            <ColorBox color={pickRandom(array)}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", null]],
              {
                  color: [
                      {
                          type: "object",
                          value: {},
                          isEmpty: true,
                          getNode: "CallExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > BinaryExpression > StringLiteral", () => {
    expect(
        extractFromCode(`
            <ColorBox color={(1 + 1) === 2 ? "purple.100" : "purple.never2"}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "purple.100"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "purple.100",
                          kind: "string",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ConditionalExpression > ParenthesizedExpression > BinaryExpression", () => {
    expect(
        extractFromCode(`
            const colorMap = {
                literalColor: "purple.200",
            };
            <ColorBox color={colorMap[(1 + 1) !== 2 ? "never" : "literalColor"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "purple.200"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "purple.200",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > CallExpression > ElementAccessExpression > ArrowFunction > ElementAccessExpression > ArrayLiteralExpression > Identifier > CallExpression > ConditionalExpression > BinaryExpression", () => {
    expect(
        extractFromCode(`
            const array = ["never1", "literalColor"]
            const getter = () => array[1];
            const colorMap = {
                literalColor: () => (1 + 1) === 3 ? "never2" : "purple.300",
            };
            <ColorBox color={colorMap[getter()]()}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "purple.300"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "purple.300",
                          kind: "string",
                          getNode: "CallExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > BinaryExpression > StringLiteral", () => {
    expect(
        extractFromCode(`
            const dot = ".";
            <ColorBox color={"purple" + dot + "400"}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "purple.400"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "purple.400",
                          kind: "string",
                          getNode: "BinaryExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > resolvable ConditionalExpression result", () => {
    expect(
        extractFromCode(`
            const isShown = true;
            const dynamicColorName = "something";
            const dynamicElement = "staticColor";
            const staticColor = "never.100" as const;

            const colorMap = {
                staticColor,
                [dynamicColorName]: "purple.500",
            };
            const dynamicColor = colorMap[dynamicElement];

            <ColorBox color={(isShown ? colorMap?.[dynamicColorName] : dynamicColor) as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "purple.500"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "purple.500",
                          kind: "string",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression with Unexpected Node: 'BindingElement' cause of useState should fallback to both possible outcome", () => {
    expect(
        extractFromCode(`
            const [isShown] = useState(true);
            const dynamicColorName = "something";
            const dynamicElement = "staticColor";
            const staticColor = "purple.700" as const;

            const colorMap = {
                staticColor,
                [dynamicColorName]: "purple.600",
            };
            const dynamicColor = colorMap[dynamicElement];

            <ColorBox color={(isShown ? colorMap?.[dynamicColorName] : dynamicColor) as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", ["purple.600", "purple.700"]]],
              {
                  color: [
                      {
                          type: "conditional",
                          whenTrue: {
                              type: "literal",
                              value: "purple.600",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                          },
                          whenFalse: {
                              type: "literal",
                              value: "purple.700",
                              kind: "string",
                              getNode: "ElementAccessExpression",
                          },
                          kind: "ternary",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > unresolvable expression will output both outcome ", () => {
    expect(
        extractFromCode(`
            const [unresolvableBoolean, setUnresolvableBoolean] = useState(false)
            const knownCondition = true;

            <ColorBox color={(!knownCondition ? "purple.800" : unresolvableBoolean ? "purple.900" : "purple.950")}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", ["purple.800", "purple.900", "purple.950"]]],
              {
                  color: [
                      {
                          type: "conditional",
                          whenTrue: {
                              type: "literal",
                              value: "purple.800",
                              kind: "string",
                              getNode: "StringLiteral",
                          },
                          whenFalse: {
                              type: "conditional",
                              whenTrue: {
                                  type: "literal",
                                  value: "purple.900",
                                  kind: "string",
                                  getNode: "StringLiteral",
                              },
                              whenFalse: {
                                  type: "literal",
                                  value: "purple.950",
                                  kind: "string",
                                  getNode: "StringLiteral",
                              },
                              kind: "ternary",
                              getNode: "ConditionalExpression",
                          },
                          kind: "ternary",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > ElementAccessExpression > nested unresolvable expression will output both outcome ", () => {
    expect(
        extractFromCode(`
            const [unresolvableBoolean, setUnresolvableBoolean] = useState(false)
            const knownCondition = true;

            const colorMap = {
                staticColor: "orange.200",
                another: "orange.300",
            };

            <ColorBox color={(!knownCondition ? "orange.100" : colorMap[unresolvableBoolean ? "staticColor" : "another"])}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", ["orange.100", "orange.200", "orange.300"]]],
              {
                  color: [
                      {
                          type: "conditional",
                          whenTrue: {
                              type: "literal",
                              value: "orange.100",
                              kind: "string",
                              getNode: "StringLiteral",
                          },
                          whenFalse: {
                              type: "conditional",
                              whenTrue: {
                                  type: "literal",
                                  value: "orange.200",
                                  kind: "string",
                                  getNode: "StringLiteral",
                              },
                              whenFalse: {
                                  type: "literal",
                                  value: "orange.300",
                                  kind: "string",
                                  getNode: "StringLiteral",
                              },
                              kind: "ternary",
                              getNode: "ConditionalExpression",
                          },
                          kind: "ternary",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > ElementAccessExpression > with nested unresolvable expression will stop at first resolved truthy condition", () => {
    expect(
        extractFromCode(`
            const [unresolvableBoolean, setUnresolvableBoolean] = useState(false)
            const knownTruthy = true;

            const colorMap = {
                staticColor: "never.200",
                another: "never.300",
            };

            <ColorBox color={(knownTruthy ? "orange.400" : colorMap[unresolvableBoolean ? "staticColor" : "another"])}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "orange.400"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "orange.400",
                          kind: "string",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > multiple variables with same name but different scope", () => {
    expect(
        extractFromCode(`
            const color = "never.500";

            const Wrapper = () => {
                const color = "orange.500";
                return <ColorBox color={color}></ColorBox>
            }

        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "orange.500"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "orange.500",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > variables referencing another var in above scope", () => {
    expect(
        extractFromCode(`
            const referenced = "orange.600";

            const Wrapper = () => {
                const color = referenced;
                return <ColorBox color={color}></ColorBox>
            }

        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "orange.600"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "orange.600",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ObjectLiteralExpression", () => {
    expect(
        extractFromCode(`
            <ColorBox {...{ color: "orange.700" }}>spread</ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "orange.700"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "orange.700",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > Identifier > ObjectLiteralExpression", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "orange.800" } as any;
            <ColorBox {...objectWithAttributes}>var spread</ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "orange.800"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "orange.800",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ConditionalExpression > Identifier/NullKeyword > falsy", () => {
    expect(
        extractFromCode(`
            const isShown = false;
            const objectWithAttributes = { color: "never.400" } as any;
            <ColorBox {...(isShown ? objectWithAttributes : null)}>conditional var spread</ColorBox>
        `)
    ).toMatchInlineSnapshot('[["ColorBox", [], {}]]');
});

it("extract JsxSpreadAttribute > ConditionalExpression > Identifier/NullKeyword > truthy", () => {
    expect(
        extractFromCode(`
            const isShown = true;
            const objectWithAttributes = { color: "orange.900" } as any;
            <ColorBox {...(isShown ? objectWithAttributes : null)}>conditional var spread</ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "orange.900"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "orange.900",
                          kind: "string",
                          getNode: "ConditionalExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > PropertyAssignment / ComputedProperty", () => {
    expect(
        extractFromCode(`
            const dynamicThemeProp = "backgroundColor";
            const dynamicAttribute = "notThemeProp";
            <ColorBox
                {...{
                    color: "teal.100",
                    [dynamicThemeProp]: "teal.200",
                    [dynamicAttribute]: "teal.300",
                }}
            >
                multiple spread
            </ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["color", "teal.100"],
                  ["backgroundColor", "teal.200"],
              ],
              {
                  color: [
                      {
                          type: "literal",
                          value: "teal.100",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
                  backgroundColor: [
                      {
                          type: "literal",
                          value: "teal.200",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ConditionalExpression > ObjectLiteralExpression/Identifier", () => {
    expect(
        extractFromCode(`
            <ColorBox {...(true ? ({ color: "teal.400" }) as any : (undefined) as unknown)}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "teal.400"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "teal.400",
                          kind: "string",
                          getNode: "ConditionalExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > BinaryExpression > AmpersandAmpersandToken / ObjectLiteralExpression", () => {
    expect(
        extractFromCode(`
            <ColorBox {...(true && ({ color: "teal.500" }))}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "teal.500"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "teal.500",
                          kind: "string",
                          getNode: "BinaryExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > CallExpression", () => {
    expect(
        extractFromCode(`
            const getColorConfig = () => ({ color: "teal.600", backgroundColor: "teal.650" });
            <ColorBox {...getColorConfig()}>spread fn result</ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["color", "teal.600"],
                  ["backgroundColor", "teal.650"],
              ],
              {
                  color: [
                      {
                          type: "literal",
                          value: "teal.600",
                          kind: "string",
                          getNode: "CallExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
                  backgroundColor: [
                      {
                          type: "literal",
                          value: "teal.650",
                          kind: "string",
                          getNode: "CallExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ObjectLiteralExpression > SpreadAssignment > CallExpression", () => {
    expect(
        extractFromCode(`
            const getColorConfig = () => ({ color: "never.700", backgroundColor: "teal.800" });
            <ColorBox {...{ ...getColorConfig(), color: "teal.700" }}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["backgroundColor", "teal.800"],
                  ["color", "teal.700"],
              ],
              {
                  backgroundColor: [
                      {
                          type: "literal",
                          value: "teal.800",
                          kind: "string",
                          getNode: "CallExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
                  color: [
                      {
                          type: "literal",
                          value: "teal.700",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ObjectLiteralExpression > SpreadAssignment > ConditionalExpression > CallExpression", () => {
    expect(
        extractFromCode(`
            const isShown = true;
            const getColorConfig = () => ({ color: "teal.900", backgroundColor: "cyan.100" });
            <ColorBox
                {...{
                    ...(isShown ? (getColorConfig() as any) : { color: "never.150" }),
                    color: "cyan.200",
                }}
            >
                nested spread conditional fn result and override
            </ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["backgroundColor", "cyan.100"],
                  ["color", "cyan.200"],
              ],
              {
                  backgroundColor: [
                      {
                          type: "literal",
                          value: "cyan.100",
                          kind: "string",
                          getNode: "ConditionalExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
                  color: [
                      {
                          type: "literal",
                          value: "cyan.200",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > BinaryExpression > AmpersandAmpersandToken / ObjectLiteralExpression", () => {
    expect(
        extractFromCode(`
            const isShown = true;
            const getColorConfig = () => ({ color: "never.300", backgroundColor: "never.400" });
            const dynamicAttribute = "background" + "Color";
            <ColorBox
                {...{
                    ...(!isShown ? (getColorConfig() as any) : ({ [dynamicAttribute]: "cyan.300" } as any)),
                    color: "cyan.400",
                }}
            >
                nested spread conditional fn result and override with object literal expression and dynamic
                attribute
            </ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["backgroundColor", "cyan.300"],
                  ["color", "cyan.400"],
              ],
              {
                  backgroundColor: [
                      {
                          type: "literal",
                          value: "cyan.300",
                          kind: "string",
                          getNode: "ConditionalExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
                  color: [
                      {
                          type: "literal",
                          value: "cyan.400",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > 3 depth spread", () => {
    expect(
        extractFromCode(`
            const getColorConfig = () => ({ color: "cyan.500", backgroundColor: "never.600" });
            <ColorBox
                {...{
                    ...{
                        ...getColorConfig(),
                        backgroundColor: "never.700",
                    },
                    backgroundColor: "cyan.600",
                }}
            >
                spread with nested spread with nested spread and override
            </ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["color", "cyan.500"],
                  ["backgroundColor", "cyan.600"],
              ],
              {
                  color: [
                      {
                          type: "literal",
                          value: "cyan.500",
                          kind: "string",
                          getNode: "CallExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
                  backgroundColor: [
                      {
                          type: "literal",
                          value: "cyan.600",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ConditionalExpression > unresolvable expression with Unexpected Node: 'BindingElement' cause of useState should fallback to both possible outcome ", () => {
    expect(
        extractFromCode(`
            const [isShown] = useState(true);
            const objectWithAttributes = { color: "cyan.700" } as any;
            <ColorBox {...(isShown ? objectWithAttributes : { backgroundColor: "cyan.800" })}>conditional var spread</ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  ["color", "cyan.700"],
                  ["backgroundColor", "cyan.800"],
              ],
              {
                  color: [
                      {
                          type: "literal",
                          value: "cyan.700",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
                  backgroundColor: [
                      {
                          type: "literal",
                          value: "cyan.800",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ElementAccessExpression", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "cyan.900" } as any;
            const themeObjectsMap = {
                basic: objectWithAttributes,
            };
            <ColorBox {...themeObjectsMap[\`basic\`]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "cyan.900"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "cyan.900",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > PropertyAccessExpression", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "salmon.100" } as any;
            const themeObjectsMap = {
                basic: objectWithAttributes,
            };
            <ColorBox {...themeObjectsMap.basic}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "salmon.100"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "salmon.100",
                          kind: "string",
                          getNode: "PropertyAccessExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > PropertyAccessExpression > nested", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "salmon.200" } as any;
            const themeObjectsMap = {
                basic: {
                    nested: objectWithAttributes
                },
            };
            <ColorBox {...themeObjectsMap.basic.nested}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "salmon.200"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "salmon.200",
                          kind: "string",
                          getNode: "PropertyAccessExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ElementAccessExpression + PropertyAccessExpression", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "salmon.300" } as any;
            const themeObjectsMap = {
                basic: { nested: objectWithAttributes },
            };
            <ColorBox {...themeObjectsMap[\`basic\`].nested}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "salmon.300"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "salmon.300",
                          kind: "string",
                          getNode: "PropertyAccessExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ElementAccessExpression > nested", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "salmon.400" } as any;
            const themeObjectsMap = {
                basic: { nested: objectWithAttributes },
            };
            <ColorBox {...themeObjectsMap[\`basic\`]["nested"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "salmon.400"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "salmon.400",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ElementAccessExpression > Identifier / ComputedProperty", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "salmon.500" } as any;
            const dynamicAttribute = "basic";
            const themeObjectsMap = {
                [dynamicAttribute]: objectWithAttributes
            };
            <ColorBox {...themeObjectsMap[dynamicAttribute]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "salmon.500"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "salmon.500",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ElementAccessExpression > ComputedProperty / TemplateStringLiteral", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "salmon.600" } as any;
            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";
            const dynamicPartsAsTemplateString = \`\${dynamicPart1}\${dynamicPart2}\`;

            const themeObjectsMap = {
                longProp: objectWithAttributes
            };
            <ColorBox {...(themeObjectsMap[\`\${dynamicPartsAsTemplateString}\`]) as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "salmon.600"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "salmon.600",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > JsxExpression > ConditionalExpression > complex nested condition > truthy + truthy", () => {
    expect(
        extractFromCode(`
            const knownCondition = true;

            const objectWithAttributes = { color: "salmon.700" } as any;
            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";

            const themeObjectsMap = {
                basic: objectWithAttributes,
                ['long' + 'Prop']: { color: "never.500" },
            };
            const getBasic = () => (themeObjectsMap as any)?.basic!;
            const getMap = { getter: getBasic };
            const assertMap = { isTrue: () => !!Boolean(true) && 1 };

            <ColorBox {...(!knownCondition ? { color: "never.250" } : assertMap.isTrue() ? getMap.getter() : themeObjectsMap[dynamicPart1 + dynamicPart2] )}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "salmon.700"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "salmon.700",
                          kind: "string",
                          getNode: "ConditionalExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > JsxExpression > ConditionalExpression > complex nested condition > truthy + falsy", () => {
    expect(
        extractFromCode(`
            const knownCondition = true;

            const objectWithAttributes = { color: "never.700" } as any;
            const dynamicPart1 = "long";
            const dynamicPart2 = "Prop";

            const themeObjectsMap = {
                basic: objectWithAttributes,
                ['long' + 'Prop']: { color: "salmon.800" },
            };
            const getBasic = () => (themeObjectsMap as any)?.basic!;
            const getMap = { getter: getBasic };
            const assertMap = { isFalse: () => false };

            <ColorBox {...(!knownCondition ? { color: "never.250" } : assertMap.isFalse() ? getMap.getter() : themeObjectsMap[dynamicPart1 + dynamicPart2] )}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "salmon.800"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "salmon.800",
                          kind: "string",
                          getNode: "ConditionalExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > JsxExpression > ConditionalExpression > unresolvable expression will output both outcome ", () => {
    expect(
        extractFromCode(`
            const [unresolvableBoolean, setUnresolvableBoolean] = useState(false)
            const knownCondition = true;

            const objectWithAttributes = { color: "salmon.850" } as any;

            const themeObjectsMap = {
                basic: objectWithAttributes,
                ['long' + 'Prop']: { color: "salmon.900" },
            };

            <ColorBox {...(!knownCondition ? { color: "never.250" } : unresolvableBoolean ? themeObjectsMap.basic : themeObjectsMap.longProp )}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", ["never.250", "salmon.850", "salmon.900"]]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "never.250",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "JsxSpreadAttribute",
                      },
                      {
                          type: "literal",
                          value: "salmon.850",
                          kind: "string",
                          getNode: "PropertyAccessExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                      {
                          type: "literal",
                          value: "salmon.900",
                          kind: "string",
                          getNode: "PropertyAccessExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxSpreadAttribute > ElementAccessExpression > CallExpression", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "white.100" } as any;
            const getDynamicAttribute = () => "basic";
            const themeObjectsMap = {
                basic: objectWithAttributes
            };
            <ColorBox {...themeObjectsMap[getDynamicAttribute()]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "white.100"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "white.100",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "JsxSpreadAttribute",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > ElementAccessExpression > CallExpression > PropertyAccessExpression", () => {
    expect(
        extractFromCode(`
            const objectWithAttributes = { color: "white.200" } as any;
            const getDynamicAttribute = () => "basic";
            const themeObjectsMap = {
                basic: objectWithAttributes
            };
            <ColorBox color={themeObjectsMap[getDynamicAttribute()].color}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "white.200"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "white.200",
                          kind: "string",
                          getNode: "PropertyAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression  > NumericLiteral", () => {
    expect(
        extractFromCode(`
            <ColorBox zIndex={1}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["zIndex", "1"]],
              {
                  zIndex: [
                      {
                          type: "literal",
                          value: "1",
                          kind: "string",
                          getNode: "NumericLiteral",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > Identifier > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const nbIndex = 2;
            <ColorBox zIndex={nbIndex}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["zIndex", "2"]],
              {
                  zIndex: [
                      {
                          type: "literal",
                          value: "2",
                          kind: "string",
                          getNode: "NumericLiteral",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > Identifier > ConditionExpression > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const nbIndex = 1;
            const isShown = true;
            <ColorBox zIndex={isShown ? 3 : 0}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["zIndex", 3]],
              {
                  zIndex: [
                      {
                          type: "literal",
                          value: 3,
                          kind: "number",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > CallExpression > immediately invoked > NumericLiteral", () => {
    expect(
        extractFromCode(`
            <ColorBox zIndex={(() => 4)()}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["zIndex", 4]],
              {
                  zIndex: [
                      {
                          type: "literal",
                          value: 4,
                          kind: "number",
                          getNode: "CallExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > CallExpression > optional + NonNullable + AsExpression > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const getMap = { get: () => 5 };
            <ColorBox zIndex={(getMap?.get()!) as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["zIndex", 5]],
              {
                  zIndex: [
                      {
                          type: "literal",
                          value: 5,
                          kind: "number",
                          getNode: "CallExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > NumericLiteral", () => {
    expect(
        extractFromCode(`
            const map = { thing: 6 };
            <ColorBox zIndex={map["thing"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["zIndex", "6"]],
              {
                  zIndex: [
                      {
                          type: "literal",
                          value: "6",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ObjectLiteralExpression > conditional sprinkles", () => {
    expect(
        extractFromCode(`
            <ColorBox color={{ mobile: "white.300", tablet: "white.400", desktop: "white.500" }}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      {
                          mobile: "white.300",
                          tablet: "white.400",
                          desktop: "white.500",
                      },
                  ],
              ],
              {
                  color: [
                      {
                          type: "map",
                          value: {
                              mobile: [
                                  {
                                      type: "literal",
                                      value: "white.300",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                              tablet: [
                                  {
                                      type: "literal",
                                      value: "white.400",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                              desktop: [
                                  {
                                      type: "literal",
                                      value: "white.500",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                          },
                          getNode: "ObjectLiteralExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > PropertyAccessExpression > ObjectLiteralExpression", () => {
    expect(
        extractFromCode(`
            const map = {
                responsiveColor: {
                    mobile: "white.600",
                    tablet: "white.700",
                    desktop: "white.800",
                }
            };

            <ColorBox color={(map?.responsiveColor) as any}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      {
                          mobile: "white.600",
                          tablet: "white.700",
                          desktop: "white.800",
                      },
                  ],
              ],
              {
                  color: [
                      {
                          type: "object",
                          value: {
                              mobile: "white.600",
                              tablet: "white.700",
                              desktop: "white.800",
                          },
                          getNode: "PropertyAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > PropertyAccessExpression > ObjectLiteralExpression", () => {
    expect(
        extractFromCode(`
            const map = {
                responsiveColor: () => ({
                    mobile: "white.600",
                    tablet: "white.700",
                    desktop: "white.800",
                })
            };

            <ColorBox color={map["responsiveColor"]!()}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      {
                          mobile: "white.600",
                          tablet: "white.700",
                          desktop: "white.800",
                      },
                  ],
              ],
              {
                  color: [
                      {
                          type: "object",
                          value: {
                              mobile: "white.600",
                              tablet: "white.700",
                              desktop: "white.800",
                          },
                          getNode: "CallExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression + AsExpression + QuestionMarkToken + TemplateExpression + BinaryExpression + CallExpression", () => {
    expect(
        extractFromCode(`
            const colorRef = "Color";
            const dynamic = "responsiveColor";
            const responsiveColor = ({
                mobile: "black.100",
                tablet: "black.200",
                desktop: "black.300",
            });

            const map = {
                [dynamic]: () => responsiveColor
            };

            <ColorBox color={((map as any)?.[\`responsive\` + \`\${colorRef}\`] as any)()}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      {
                          mobile: "black.100",
                          tablet: "black.200",
                          desktop: "black.300",
                      },
                  ],
              ],
              {
                  color: [
                      {
                          type: "object",
                          value: {
                              mobile: "black.100",
                              tablet: "black.200",
                              desktop: "black.300",
                          },
                          getNode: "CallExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > StringLiteral/ObjectLiteralExpression (conditional sprinkles) > truthy", () => {
    expect(
        extractFromCode(`
            <ColorBox color={true ? { mobile: "black.400", tablet: "black.500", desktop: "black.600" } : "black.700"}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      {
                          mobile: "black.400",
                          tablet: "black.500",
                          desktop: "black.600",
                      },
                  ],
              ],
              {
                  color: [
                      {
                          type: "object",
                          value: {
                              mobile: "black.400",
                              tablet: "black.500",
                              desktop: "black.600",
                          },
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > StringLiteral/ObjectLiteralExpression (conditional sprinkles) > falsy", () => {
    expect(
        extractFromCode(`
            <ColorBox color={false ? { mobile: "black.400", tablet: "black.500", desktop: "black.600" } : "black.700"}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "black.700"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "black.700",
                          kind: "string",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ConditionalExpression > StringLiteral/ObjectLiteralExpression (conditional sprinkles) > unresolvable condition", () => {
    expect(
        extractFromCode(`
            const [isShown] = useState(true);
            <ColorBox color={isShown ? { mobile: "black.400", tablet: "black.500", desktop: "black.600" } : "black.700"}></ColorBox>
        `)
    ).toMatchInlineSnapshot(
        `
      [
          [
              "ColorBox",
              [
                  [
                      "color",
                      [
                          {
                              mobile: "black.400",
                              tablet: "black.500",
                              desktop: "black.600",
                          },
                          "black.700",
                      ],
                  ],
              ],
              {
                  color: [
                      {
                          type: "conditional",
                          whenTrue: {
                              type: "map",
                              value: {
                                  mobile: [
                                      {
                                          type: "literal",
                                          value: "black.400",
                                          kind: "string",
                                          getNode: "StringLiteral",
                                      },
                                  ],
                                  tablet: [
                                      {
                                          type: "literal",
                                          value: "black.500",
                                          kind: "string",
                                          getNode: "StringLiteral",
                                      },
                                  ],
                                  desktop: [
                                      {
                                          type: "literal",
                                          value: "black.600",
                                          kind: "string",
                                          getNode: "StringLiteral",
                                      },
                                  ],
                              },
                              getNode: "ObjectLiteralExpression",
                          },
                          whenFalse: {
                              type: "literal",
                              value: "black.700",
                              kind: "string",
                              getNode: "StringLiteral",
                          },
                          kind: "ternary",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `
    );
});

it("extract JsxAttribute > JsxExpression > reversed", () => {
    expect(
        extractFromCode(`
            <ColorBox mobile={{ color: "sky.100", tablet: "sky.200", desktop: "sky.300" }} />
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "mobile",
                      {
                          color: "sky.100",
                          tablet: "sky.200",
                          desktop: "sky.300",
                      },
                  ],
              ],
              {
                  mobile: [
                      {
                          type: "map",
                          value: {
                              color: [
                                  {
                                      type: "literal",
                                      value: "sky.100",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                              tablet: [
                                  {
                                      type: "literal",
                                      value: "sky.200",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                              desktop: [
                                  {
                                      type: "literal",
                                      value: "sky.300",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                          },
                          getNode: "ObjectLiteralExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > ObjectLiteralExpression > css prop", () => {
    expect(
        extractFromCode(`
        <ColorBox
            css={{
                backgroundColor: "sky.500",
                __color: "##ff0",
                mobile: { fontSize: "2xl", display: true ? "flex" : "block" },
                zIndex: { desktop: "10" },
            }}
        >
            css prop
        </ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "css",
                      {
                          backgroundColor: "sky.500",
                          __color: "##ff0",
                          mobile: {
                              fontSize: "2xl",
                              display: "flex",
                          },
                          zIndex: {
                              desktop: "10",
                          },
                      },
                  ],
              ],
              {
                  css: [
                      {
                          type: "map",
                          value: {
                              backgroundColor: [
                                  {
                                      type: "literal",
                                      value: "sky.500",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                              __color: [
                                  {
                                      type: "literal",
                                      value: "##ff0",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                              mobile: [
                                  {
                                      type: "map",
                                      value: {
                                          fontSize: [
                                              {
                                                  type: "literal",
                                                  value: "2xl",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                          ],
                                          display: [
                                              {
                                                  type: "literal",
                                                  value: "flex",
                                                  kind: "string",
                                                  getNode: "ConditionalExpression",
                                              },
                                          ],
                                      },
                                      getNode: "ObjectLiteralExpression",
                                  },
                              ],
                              zIndex: [
                                  {
                                      type: "map",
                                      value: {
                                          desktop: [
                                              {
                                                  type: "literal",
                                                  value: "10",
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
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > ObjectLiteralExpression > css prop > ConditionalExpression", () => {
    expect(
        extractFromCode(`
        const [isShown] = useState(true);
        <ColorBox
            css={true ? {
                backgroundColor: "sky.600",
                __color: "##ff0",
                mobile: { fontSize: "2xl", display: isShown ? "flex" : "block" },
                zIndex: { desktop: "10" },
            } : "sky.700"}
        >
            css prop
        </ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "css",
                      [
                          {
                              backgroundColor: "sky.600",
                              __color: "##ff0",
                              mobile: {
                                  fontSize: "2xl",
                                  display: ["flex", "block"],
                              },
                              zIndex: {
                                  desktop: "10",
                              },
                          },
                          "sky.700",
                      ],
                  ],
              ],
              {
                  css: [
                      {
                          type: "conditional",
                          whenTrue: {
                              type: "map",
                              value: {
                                  backgroundColor: [
                                      {
                                          type: "literal",
                                          value: "sky.600",
                                          kind: "string",
                                          getNode: "StringLiteral",
                                      },
                                  ],
                                  __color: [
                                      {
                                          type: "literal",
                                          value: "##ff0",
                                          kind: "string",
                                          getNode: "StringLiteral",
                                      },
                                  ],
                                  mobile: [
                                      {
                                          type: "map",
                                          value: {
                                              fontSize: [
                                                  {
                                                      type: "literal",
                                                      value: "2xl",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              display: [
                                                  {
                                                      type: "conditional",
                                                      whenTrue: {
                                                          type: "literal",
                                                          value: "flex",
                                                          kind: "string",
                                                          getNode: "StringLiteral",
                                                      },
                                                      whenFalse: {
                                                          type: "literal",
                                                          value: "block",
                                                          kind: "string",
                                                          getNode: "StringLiteral",
                                                      },
                                                      kind: "ternary",
                                                      getNode: "ConditionalExpression",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                      },
                                  ],
                                  zIndex: [
                                      {
                                          type: "map",
                                          value: {
                                              desktop: [
                                                  {
                                                      type: "literal",
                                                      value: "10",
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
                          },
                          whenFalse: {
                              type: "literal",
                              value: "sky.700",
                              kind: "string",
                              getNode: "StringLiteral",
                          },
                          kind: "ternary",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > ObjectLiteralExpression > css prop > PropertyAssignment > ConditionalExpression", () => {
    expect(
        extractFromCode(`
        const [isShown] = useState(true);
        <ColorBox
            css={{
                backgroundColor: isShown ? "sky.800" : "sky.900",
                __color: "##ff0",
                mobile: isShown ? { fontSize: "2xl", display: true ? "flex" : "block" } : "crimson.900",
                zIndex: { desktop: "10" },
            }}
        >
            css prop
        </ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [
                  [
                      "css",
                      {
                          backgroundColor: ["sky.800", "sky.900"],
                          __color: "##ff0",
                          mobile: [
                              {
                                  fontSize: "2xl",
                                  display: "flex",
                              },
                              "crimson.900",
                          ],
                          zIndex: {
                              desktop: "10",
                          },
                      },
                  ],
              ],
              {
                  css: [
                      {
                          type: "map",
                          value: {
                              backgroundColor: [
                                  {
                                      type: "conditional",
                                      whenTrue: {
                                          type: "literal",
                                          value: "sky.800",
                                          kind: "string",
                                          getNode: "StringLiteral",
                                      },
                                      whenFalse: {
                                          type: "literal",
                                          value: "sky.900",
                                          kind: "string",
                                          getNode: "StringLiteral",
                                      },
                                      kind: "ternary",
                                      getNode: "ConditionalExpression",
                                  },
                              ],
                              __color: [
                                  {
                                      type: "literal",
                                      value: "##ff0",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                              mobile: [
                                  {
                                      type: "conditional",
                                      whenTrue: {
                                          type: "map",
                                          value: {
                                              fontSize: [
                                                  {
                                                      type: "literal",
                                                      value: "2xl",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              display: [
                                                  {
                                                      type: "literal",
                                                      value: "flex",
                                                      kind: "string",
                                                      getNode: "ConditionalExpression",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                      },
                                      whenFalse: {
                                          type: "literal",
                                          value: "crimson.900",
                                          kind: "string",
                                          getNode: "StringLiteral",
                                      },
                                      kind: "ternary",
                                      getNode: "ConditionalExpression",
                                  },
                              ],
                              zIndex: [
                                  {
                                      type: "map",
                                      value: {
                                          desktop: [
                                              {
                                                  type: "literal",
                                                  value: "10",
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
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > Identifier > BinaryExpression > (PropertyAccessExpression + QuestionQuestionToken + StringLiteral)", () => {
    expect(
        extractFromCode(`
            const color = props.color ?? "apple.100";

            <ColorBox color={color}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "apple.100"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "apple.100",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > Identifier > BinaryExpression > (PropertyAccessExpression + AmpersandAmpersandToken + StringLiteral)", () => {
    expect(
        extractFromCode(`
            const color = props.color && "apple.200";

            <ColorBox color={color}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "apple.200"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "apple.200",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > Identifier > BinaryExpression > (PropertyAccessExpression + BarBarToken + StringLiteral)", () => {
    expect(
        extractFromCode(`
            const color = props.color || "apple.300";

            <ColorBox color={color}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "apple.300"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "apple.300",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > Identifier > ArrayLiteralExpression)", () => {
    expect(
        extractFromCode(`
            const color = ["apple.400", "apple.500"];

            <ColorBox color={color}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", ["apple.400", "apple.500"]]],
              {
                  color: [
                      {
                          type: "list",
                          value: [
                              {
                                  type: "literal",
                                  value: "apple.400",
                                  kind: "string",
                                  getNode: "StringLiteral",
                              },
                              {
                                  type: "literal",
                                  value: "apple.500",
                                  kind: "string",
                                  getNode: "StringLiteral",
                              },
                          ],
                          getNode: "ArrayLiteralExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ElementAccessExpression > ObjectLiteralExpression > PropertyAssignment > StringLiteral", () => {
    expect(
        extractFromCode(`
            <ColorBox color={({
                "apple": "apple.600",
            })["apple"]}></ColorBox>
        `)
    ).toMatchInlineSnapshot(`
      [
          [
              "ColorBox",
              [["color", "apple.600"]],
              {
                  color: [
                      {
                          type: "literal",
                          value: "apple.600",
                          kind: "string",
                          getNode: "ElementAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute + CallExpression > booleans", () => {
    expect(
        extractFromCode(
            `
            <Container className={someFn({ isFlex: false })} withBorder={true} />
        `,
            { components: ["Container"], functions: ["someFn"] }
        )
    ).toMatchInlineSnapshot(`
      [
          [
              "Container",
              [
                  ["className", null],
                  ["withBorder", true],
              ],
              {
                  className: [
                      {
                          type: "object",
                          value: {},
                          isEmpty: true,
                          getNode: "CallExpression",
                          fromNode: "Identifier",
                      },
                  ],
                  withBorder: [
                      {
                          type: "literal",
                          value: true,
                          kind: "boolean",
                          getNode: "TrueKeyword",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
          [
              "someFn",
              [["isFlex", false]],
              {
                  isFlex: [
                      {
                          type: "literal",
                          value: false,
                          kind: "boolean",
                          getNode: "FalseKeyword",
                          fromNode: "CallExpression",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > ArrayLiteralExpression", () => {
    expect(
        extractFromCode(
            `
            <Container classNames={["color:main", "hover:secondary"]} config={{ state: ["hovered", "focused"] }} />
        `,
            { components: ["Container"] }
        )
    ).toMatchInlineSnapshot(`
      [
          [
              "Container",
              [
                  ["classNames", ["color:main", "hover:secondary"]],
                  [
                      "config",
                      {
                          state: ["hovered", "focused"],
                      },
                  ],
              ],
              {
                  classNames: [
                      {
                          type: "list",
                          value: [
                              {
                                  type: "literal",
                                  value: "color:main",
                                  kind: "string",
                                  getNode: "StringLiteral",
                              },
                              {
                                  type: "literal",
                                  value: "hover:secondary",
                                  kind: "string",
                                  getNode: "StringLiteral",
                              },
                          ],
                          getNode: "ArrayLiteralExpression",
                          fromNode: "Identifier",
                      },
                  ],
                  config: [
                      {
                          type: "map",
                          value: {
                              state: [
                                  {
                                      type: "list",
                                      value: [
                                          {
                                              type: "literal",
                                              value: "hovered",
                                              kind: "string",
                                              getNode: "StringLiteral",
                                          },
                                          {
                                              type: "literal",
                                              value: "focused",
                                              kind: "string",
                                              getNode: "StringLiteral",
                                          },
                                      ],
                                      getNode: "ArrayLiteralExpression",
                                  },
                              ],
                          },
                          getNode: "ObjectLiteralExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > Identifier without initializer", () => {
    expect(
        extractFromCode(
            `
            <Flex col />
        `,
            { components: ["Flex"] }
        )
    ).toMatchInlineSnapshot(`
      [
          [
              "Flex",
              [["col", null]],
              {
                  col: [
                      {
                          type: "empty-initializer",
                          getNode: "Identifier",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract CallExpression > ObjectLiteralExpression > PropertyAssignment > ObjectLiteralExpression > PropertyAssignment > ArrayLiteralExpression > StringLiteral)", () => {
    expect(
        extractFromCode(
            `
            const props = defineProperties({
                properties: {
                    position: ["relative", "absolute"],
                    display: ["block", "inline-block", "flex", "inline-flex"],
                },
                shorthands: {
                    p: ["position"],
                    d: ["display"],
                },
            });
        `,
            { components: [], functions: ["defineProperties"] }
        )
    ).toMatchInlineSnapshot(`
      [
          [
              "defineProperties",
              [
                  [
                      "properties",
                      {
                          position: ["relative", "absolute"],
                          display: ["block", "inline-block", "flex", "inline-flex"],
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
    `);
});

it("extract real-world Stack example ", () => {
    expect(
        extractFromCode(
            `
        export const Stack = <TType extends React.ElementType = typeof defaultElement>(
            props: PolymorphicComponentProps<StackProps, TType>
        ) => {
            const { children, as, spacing, ...rest } = props;
            const stackItems = Children.toArray(children);
            const direction = props.flexDirection ?? "column";

            return (
                <Box display="flex" flexDirection={direction} {...rest}>
                    {stackItems.map((item, index) => (
                        <Box
                            key={index}
                            pr={direction === "row" ? (index !== stackItems.length - 1 ? spacing : undefined) : undefined}
                            pb={direction === "column" ? (index !== stackItems.length - 1 ? spacing : undefined) : undefined}
                        >
                            {item}
                        </Box>
                    ))}
                </Box>
            );
        };

        const Something = () => {
            return (
                <Stack
                    as="header"
                    flexWrap="wrap"
                    alignItems="flex-end"
                    justifyContent="flex-end"
                    paddingRight={2}
                    paddingBottom={2}
                    borderBottomWidth="1px"
                    borderBottomColor="gray.400"
                    className={css.header}
                    _tablet={{ justifyContent: "space-between" }}
                />
            );
        };
        `,
            { components: ["Box", "Stack"] }
        )
    ).toMatchInlineSnapshot(`
      [
          [
              "Box",
              [
                  ["display", "flex"],
                  ["flexDirection", "column"],
                  ["key", null],
                  ["pr", {}],
                  ["pb", {}],
              ],
              {
                  display: [
                      {
                          type: "literal",
                          value: "flex",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
                  flexDirection: [
                      {
                          type: "literal",
                          value: "column",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
                  key: [
                      {
                          type: "object",
                          value: {},
                          isEmpty: true,
                          getNode: "Identifier",
                          fromNode: "Identifier",
                      },
                  ],
                  pr: [
                      {
                          type: "map",
                          value: {},
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                  ],
                  pb: [
                      {
                          type: "map",
                          value: {},
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
          [
              "Stack",
              [
                  ["as", "header"],
                  ["flexWrap", "wrap"],
                  ["alignItems", "flex-end"],
                  ["justifyContent", "flex-end"],
                  ["paddingRight", "2"],
                  ["paddingBottom", "2"],
                  ["borderBottomWidth", "1px"],
                  ["borderBottomColor", "gray.400"],
                  ["className", null],
                  [
                      "_tablet",
                      {
                          justifyContent: "space-between",
                      },
                  ],
              ],
              {
                  as: [
                      {
                          type: "literal",
                          value: "header",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
                  flexWrap: [
                      {
                          type: "literal",
                          value: "wrap",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
                  alignItems: [
                      {
                          type: "literal",
                          value: "flex-end",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
                  justifyContent: [
                      {
                          type: "literal",
                          value: "flex-end",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
                  paddingRight: [
                      {
                          type: "literal",
                          value: "2",
                          kind: "string",
                          getNode: "NumericLiteral",
                          fromNode: "Identifier",
                      },
                  ],
                  paddingBottom: [
                      {
                          type: "literal",
                          value: "2",
                          kind: "string",
                          getNode: "NumericLiteral",
                          fromNode: "Identifier",
                      },
                  ],
                  borderBottomWidth: [
                      {
                          type: "literal",
                          value: "1px",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
                  borderBottomColor: [
                      {
                          type: "literal",
                          value: "gray.400",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                  ],
                  className: [
                      {
                          type: "object",
                          value: {},
                          isEmpty: true,
                          getNode: "PropertyAccessExpression",
                          fromNode: "Identifier",
                      },
                  ],
                  _tablet: [
                      {
                          type: "map",
                          value: {
                              justifyContent: [
                                  {
                                      type: "literal",
                                      value: "space-between",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                          },
                          getNode: "ObjectLiteralExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > JsxExpression > CallExpression > ObjectLiteralExpression > PropertyAssignment > TrueKeyword", () => {
    expect(
        extractFromCode(
            `
        <button class={button({ color: "accent", size: "large", rounded: true })}>
        `,
            { components: [], functions: ["button"] }
        )
    ).toMatchInlineSnapshot(`
      [
          [
              "button",
              [
                  ["color", "accent"],
                  ["size", "large"],
                  ["rounded", true],
              ],
              {
                  color: [
                      {
                          type: "literal",
                          value: "accent",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "CallExpression",
                      },
                  ],
                  size: [
                      {
                          type: "literal",
                          value: "large",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "CallExpression",
                      },
                  ],
                  rounded: [
                      {
                          type: "literal",
                          value: true,
                          kind: "boolean",
                          getNode: "TrueKeyword",
                          fromNode: "CallExpression",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract JsxAttribute > Identifier > StringLiteral tailwind-like", () => {
    expect(
        extractFromCode(
            `
            export function composeClassNames(...classNames: Array<string | undefined>) {
                const classes = classNames
                    .filter((className) => Boolean(className) && className !== " ")
                    .map((className) => className?.toString().trim()) as string[];
                return classes.length === 0 ? undefined : classes.join(" ");
            }

            function clsx (...classNames)  {
                return classNames.reduce((acc, className) => {
                    if (typeof className === "string") {
                        return acc.concat(className);
                    }
                    if (Array.isArray(className)) {
                        return acc.concat(className.filter(Boolean).join(" "));
                    }
                    return acc.concat(Object.entries(className).filter(([, value]) => Boolean(value)).map(([key]) => key))
                }, []).join(" ");
            }

            <div className="bg-slate-100 rounded-xl p-8 dark:bg-slate-800" />
            <div className={isHovered ? ["bg-sky-400", "text-lg"] : "bg-sky-800"} />
            <div className={composeClassNames("bg-sky-400", "text-lg", "bg-sky-800")} />
            <div className={clsx("bg-red-400", { ["bg-white"]: true, shadow: false }, ["rounded", "w-48", "text-sm"])} />

            const [unresolvable] = useState(true);
            <div className={clsx("basic", { ["fine"]: true, stillFine: false, nope: unresolvable })} />
        `,
            { components: ["div"] }
        )
    ).toMatchInlineSnapshot(`
      [
          [
              "div",
              [
                  [
                      "className",
                      [
                          "bg-slate-100 rounded-xl p-8 dark:bg-slate-800",
                          ["bg-sky-400", "text-lg", "bg-sky-800"],
                          "bg-sky-400 text-lg bg-sky-800",
                          "bg-red-400 bg-white rounded w-48 text-sm",
                      ],
                  ],
              ],
              {
                  className: [
                      {
                          type: "literal",
                          value: "bg-slate-100 rounded-xl p-8 dark:bg-slate-800",
                          kind: "string",
                          getNode: "StringLiteral",
                          fromNode: "Identifier",
                      },
                      {
                          type: "conditional",
                          whenTrue: {
                              type: "list",
                              value: [
                                  {
                                      type: "literal",
                                      value: "bg-sky-400",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                                  {
                                      type: "literal",
                                      value: "text-lg",
                                      kind: "string",
                                      getNode: "StringLiteral",
                                  },
                              ],
                              getNode: "ArrayLiteralExpression",
                          },
                          whenFalse: {
                              type: "literal",
                              value: "bg-sky-800",
                              kind: "string",
                              getNode: "StringLiteral",
                          },
                          kind: "ternary",
                          getNode: "ConditionalExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "bg-sky-400 text-lg bg-sky-800",
                          kind: "string",
                          getNode: "CallExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "literal",
                          value: "bg-red-400 bg-white rounded w-48 text-sm",
                          kind: "string",
                          getNode: "CallExpression",
                          fromNode: "Identifier",
                      },
                      {
                          type: "object",
                          value: {},
                          isEmpty: true,
                          getNode: "CallExpression",
                          fromNode: "Identifier",
                      },
                  ],
              },
          ],
      ]
    `);
});

it("extract defineProperties config", () => {
    const extractMap = new Map();
    extractFromCode(
        `
    const tw = defineProperties({
        conditions: {
            small: { selector: ".small &" },
            large: { selector: ".large &" },
            dark: { selector: ".dark &" },
            light: { selector: ".light &" },
            hover: { selector: "&:hover" },
            navItem: { selector: 'nav li > &' },
            hoverNotActive: { selector: '&:hover:not(:active)' }
        },
        defaultCondition: "small",
        properties: {
            display: true,
            color: tokens.colors,
            backgroundColor: tokens.colors,
            borderColor: tokens.colors,
            borderRadius: tokens.radii,
            padding: {
                4: "4px",
                8: "8px",
                12: "12px",
                16: "16px",
                20: "20px",
                24: "24px",
            },
            width: {
                "1/2": "50%",
            },
        },
        shorthands: {
            d: ["display"],
            w: ["width"],
            bg: ["backgroundColor"],
            p: ["padding"],
            rounded: ["borderRadius"],
        },
    });
    `,
        { functions: ["defineProperties"], extractMap }
    );
    const definePropsConfig = extractMap.get("defineProperties") as FunctionNodesMap;

    expect(definePropsConfig.queryList).toMatchInlineSnapshot(`
      [
          {
              fromNode: "CallExpression",
              box: {
                  type: "map",
                  value: {
                      conditions: [
                          {
                              type: "map",
                              value: {
                                  small: [
                                      {
                                          type: "map",
                                          value: {
                                              selector: [
                                                  {
                                                      type: "literal",
                                                      value: ".small &",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                      },
                                  ],
                                  large: [
                                      {
                                          type: "map",
                                          value: {
                                              selector: [
                                                  {
                                                      type: "literal",
                                                      value: ".large &",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                      },
                                  ],
                                  dark: [
                                      {
                                          type: "map",
                                          value: {
                                              selector: [
                                                  {
                                                      type: "literal",
                                                      value: ".dark &",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                      },
                                  ],
                                  light: [
                                      {
                                          type: "map",
                                          value: {
                                              selector: [
                                                  {
                                                      type: "literal",
                                                      value: ".light &",
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
                                  navItem: [
                                      {
                                          type: "map",
                                          value: {
                                              selector: [
                                                  {
                                                      type: "literal",
                                                      value: "nav li > &",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                      },
                                  ],
                                  hoverNotActive: [
                                      {
                                          type: "map",
                                          value: {
                                              selector: [
                                                  {
                                                      type: "literal",
                                                      value: "&:hover:not(:active)",
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
                              value: "small",
                              kind: "string",
                              getNode: "StringLiteral",
                              fromNode: "CallExpression",
                          },
                      ],
                      properties: [
                          {
                              type: "map",
                              value: {
                                  display: [
                                      {
                                          type: "literal",
                                          value: true,
                                          kind: "boolean",
                                          getNode: "TrueKeyword",
                                      },
                                  ],
                                  color: [
                                      {
                                          type: "object",
                                          value: {},
                                          isEmpty: true,
                                          getNode: "PropertyAccessExpression",
                                      },
                                  ],
                                  backgroundColor: [
                                      {
                                          type: "object",
                                          value: {},
                                          isEmpty: true,
                                          getNode: "PropertyAccessExpression",
                                      },
                                  ],
                                  borderColor: [
                                      {
                                          type: "object",
                                          value: {},
                                          isEmpty: true,
                                          getNode: "PropertyAccessExpression",
                                      },
                                  ],
                                  borderRadius: [
                                      {
                                          type: "object",
                                          value: {},
                                          isEmpty: true,
                                          getNode: "PropertyAccessExpression",
                                      },
                                  ],
                                  padding: [
                                      {
                                          type: "map",
                                          value: {
                                              "4": [
                                                  {
                                                      type: "literal",
                                                      value: "4px",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "8": [
                                                  {
                                                      type: "literal",
                                                      value: "8px",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "12": [
                                                  {
                                                      type: "literal",
                                                      value: "12px",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "16": [
                                                  {
                                                      type: "literal",
                                                      value: "16px",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "20": [
                                                  {
                                                      type: "literal",
                                                      value: "20px",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "24": [
                                                  {
                                                      type: "literal",
                                                      value: "24px",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                      },
                                  ],
                                  width: [
                                      {
                                          type: "map",
                                          value: {
                                              "1/2": [
                                                  {
                                                      type: "literal",
                                                      value: "50%",
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
                                  w: [
                                      {
                                          type: "list",
                                          value: [
                                              {
                                                  type: "literal",
                                                  value: "width",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                          ],
                                          getNode: "ArrayLiteralExpression",
                                      },
                                  ],
                                  bg: [
                                      {
                                          type: "list",
                                          value: [
                                              {
                                                  type: "literal",
                                                  value: "backgroundColor",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                          ],
                                          getNode: "ArrayLiteralExpression",
                                      },
                                  ],
                                  p: [
                                      {
                                          type: "list",
                                          value: [
                                              {
                                                  type: "literal",
                                                  value: "padding",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                          ],
                                          getNode: "ArrayLiteralExpression",
                                      },
                                  ],
                                  rounded: [
                                      {
                                          type: "list",
                                          value: [
                                              {
                                                  type: "literal",
                                                  value: "borderRadius",
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
                  getNode: "CallExpression",
                  fromNode: "CallExpression",
              },
          },
      ]
    `);
});
// TODO nested valueOrNullable ?? fallback ?? fallback
// TODO ElementAccessExpression with conditionals other than ternary
