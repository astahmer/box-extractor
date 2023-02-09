import {
    BoxNodesMap,
    ComponentNodesMap,
    extract,
    ExtractOptions,
    FunctionNodesMap,
    QueryFnBox,
    unbox,
} from "@box-extractor/core";
import { Project, SourceFile, ts } from "ts-morph";
import { afterEach, expect, it } from "vitest";

import { endFileScope, setFileScope } from "@vanilla-extract/css/fileScope";
import MagicString from "magic-string";
import type { GenericConfig } from "../src/defineProperties";
import { generateStyleFromExtraction } from "../src/generateStyleFromExtraction";
import { createAdapterContext } from "../src/jit-style";
import { transformStyleNodes } from "../src/transformStyleNodes";

// TODO test with @media
// https://vanilla-extract.style/documentation/api/style/

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
    const minimalSprinkles = defineProperties({
        properties: {
            color: {
                brand: "var(--brand)",
            }
        },
    });

    const tokens = {
        spacing: {
            4: "4px",
            8: "8px",
            12: "12px",
            16: "16px",
            20: "20px",
            24: "24px",
        },
        radii: {
            none: "0",
            sm: "0.125rem",
            base: "0.25rem",
            md: "0.375rem",
            lg: "0.5rem",
            xl: "0.75rem",
            "2xl": "1rem",
            "3xl": "1.5rem",
            full: "9999px",
        },
    }

    const tw = defineProperties({
        properties: {
            borderRadius: tokens.radii,
            padding: tokens.spacing,
        },
        shorthands: {
            p: ["padding"],
            rounded: ["borderRadius"],
        },
    });

    export const MinimalSprinklesDemo = () => {
        return <div className={minimalSprinkles({ color: "brand" })}>
            <div className={[minimalSprinkles({ color: "red.100", display: "flex" }), tw({ p: 24, rounded: 'lg' })].join(' ')}></div>
        </div>;
    };`,
        { scriptKind: ts.ScriptKind.TSX }
    );

    const extractDefs = extractFromCode(sourceFile, { functions: ["defineProperties"] });
    const queryList = (extractDefs.get("defineProperties") as FunctionNodesMap).queryList;
    expect(queryList).toMatchInlineSnapshot(`
      [
          {
              name: "defineProperties",
              box: {
                  stack: ["CallExpression"],
                  type: "list",
                  node: "CallExpression",
                  value: [
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
                                          color: [
                                              {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                  ],
                                                  type: "map",
                                                  node: "ObjectLiteralExpression",
                                                  value: {
                                                      brand: [
                                                          {
                                                              stack: [
                                                                  "CallExpression",
                                                                  "ObjectLiteralExpression",
                                                                  "PropertyAssignment",
                                                                  "ObjectLiteralExpression",
                                                                  "PropertyAssignment",
                                                                  "ObjectLiteralExpression",
                                                                  "PropertyAssignment",
                                                                  "StringLiteral",
                                                              ],
                                                              type: "literal",
                                                              node: "StringLiteral",
                                                              value: "var(--brand)",
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
                  ],
              },
          },
          {
              name: "defineProperties",
              box: {
                  stack: ["CallExpression"],
                  type: "list",
                  node: "CallExpression",
                  value: [
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
                                          borderRadius: [
                                              {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                  ],
                                                  type: "object",
                                                  node: "PropertyAccessExpression",
                                                  value: {
                                                      none: "0",
                                                      sm: "0.125rem",
                                                      base: "0.25rem",
                                                      md: "0.375rem",
                                                      lg: "0.5rem",
                                                      xl: "0.75rem",
                                                      "2xl": "1rem",
                                                      "3xl": "1.5rem",
                                                      full: "9999px",
                                                  },
                                              },
                                          ],
                                          padding: [
                                              {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                  ],
                                                  type: "object",
                                                  node: "PropertyAccessExpression",
                                                  value: {
                                                      "4": "4px",
                                                      "8": "8px",
                                                      "12": "12px",
                                                      "16": "16px",
                                                      "20": "20px",
                                                      "24": "24px",
                                                  },
                                              },
                                          ],
                                      },
                                  },
                              ],
                              shorthands: [
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
                                          p: [
                                              {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ArrayLiteralExpression",
                                                  ],
                                                  type: "list",
                                                  node: "ArrayLiteralExpression",
                                                  value: [
                                                      {
                                                          stack: [
                                                              "CallExpression",
                                                              "ObjectLiteralExpression",
                                                              "PropertyAssignment",
                                                              "ObjectLiteralExpression",
                                                              "PropertyAssignment",
                                                              "ArrayLiteralExpression",
                                                          ],
                                                          type: "literal",
                                                          node: "StringLiteral",
                                                          value: "padding",
                                                          kind: "string",
                                                      },
                                                  ],
                                              },
                                          ],
                                          rounded: [
                                              {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ArrayLiteralExpression",
                                                  ],
                                                  type: "list",
                                                  node: "ArrayLiteralExpression",
                                                  value: [
                                                      {
                                                          stack: [
                                                              "CallExpression",
                                                              "ObjectLiteralExpression",
                                                              "PropertyAssignment",
                                                              "ObjectLiteralExpression",
                                                              "PropertyAssignment",
                                                              "ArrayLiteralExpression",
                                                          ],
                                                          type: "literal",
                                                          node: "StringLiteral",
                                                          value: "borderRadius",
                                                          kind: "string",
                                                      },
                                                  ],
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
      ]
    `);
    expect(queryList.map((q) => unbox(q.box.value[0]))).toMatchInlineSnapshot(`
      [
          {
              properties: {
                  color: {
                      brand: "var(--brand)",
                  },
              },
          },
          {
              properties: {
                  borderRadius: {
                      none: "0",
                      sm: "0.125rem",
                      base: "0.25rem",
                      md: "0.375rem",
                      lg: "0.5rem",
                      xl: "0.75rem",
                      "2xl": "1rem",
                      "3xl": "1.5rem",
                      full: "9999px",
                  },
                  padding: {
                      "4": "4px",
                      "8": "8px",
                      "12": "12px",
                      "16": "16px",
                      "20": "20px",
                      "24": "24px",
                  },
              },
              shorthands: {
                  p: ["padding"],
                  rounded: ["borderRadius"],
              },
          },
      ]
    `);

    const configByName = new Map<string, { query: QueryFnBox; config: GenericConfig }>();
    queryList.forEach((query) => {
        const from = query.fromNode();
        const declaration = from.getParentIfKindOrThrow(ts.SyntaxKind.VariableDeclaration);
        const nameNode = declaration.getNameNode();
        const name = nameNode.getText();
        const value = unbox(query.box.value[0]!);
        configByName.set(name, { query, config: value as GenericConfig });
    });

    const extracted = extractFromCode(sourceFile, { functions: ["minimalSprinkles", "tw"] });

    const ctx = createAdapterContext("debug");
    ctx.setAdapter();
    setFileScope("test/jit-style.test.ts");

    const minimalSprinkles = extracted.get("minimalSprinkles")! as FunctionNodesMap;
    expect(minimalSprinkles.queryList).toMatchInlineSnapshot(`
      [
          {
              name: "minimalSprinkles",
              box: {
                  stack: ["CallExpression"],
                  type: "list",
                  node: "CallExpression",
                  value: [
                      {
                          stack: ["CallExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "CallExpression",
                          value: {
                              color: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "StringLiteral",
                                      ],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "brand",
                                      kind: "string",
                                  },
                              ],
                          },
                      },
                  ],
              },
          },
          {
              name: "minimalSprinkles",
              box: {
                  stack: ["CallExpression"],
                  type: "list",
                  node: "CallExpression",
                  value: [
                      {
                          stack: ["CallExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "CallExpression",
                          value: {
                              color: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "StringLiteral",
                                      ],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "red.100",
                                      kind: "string",
                                  },
                              ],
                              display: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "StringLiteral",
                                      ],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "flex",
                                      kind: "string",
                                  },
                              ],
                          },
                      },
                  ],
              },
          },
      ]
    `);

    const minimalStyles = generateStyleFromExtraction(
        "minimalSprinkles",
        minimalSprinkles,
        configByName.get("minimalSprinkles")!.config
    );
    expect(minimalStyles.classMap).toMatchInlineSnapshot(`
      {
          minimalSprinkles_color_brand: "minimalSprinkles_color_brand__1rxundp0",
          "minimalSprinkles_color_red.100": "minimalSprinkles_color_red.100__1rxundp1",
      }
    `);

    const magicStr = new MagicString(sourceFile.getFullText());
    const generateStyleResults = new Set<ReturnType<typeof generateStyleFromExtraction>>();
    generateStyleResults.add(minimalStyles);

    const tw = extracted.get("tw")! as FunctionNodesMap;
    expect(tw.queryList).toMatchInlineSnapshot(`
      [
          {
              name: "tw",
              box: {
                  stack: ["CallExpression"],
                  type: "list",
                  node: "CallExpression",
                  value: [
                      {
                          stack: ["CallExpression", "ObjectLiteralExpression"],
                          type: "map",
                          node: "CallExpression",
                          value: {
                              p: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "NumericLiteral",
                                      ],
                                      type: "literal",
                                      node: "NumericLiteral",
                                      value: "24",
                                      kind: "string",
                                  },
                              ],
                              rounded: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "StringLiteral",
                                      ],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "lg",
                                      kind: "string",
                                  },
                              ],
                          },
                      },
                  ],
              },
          },
      ]
    `);

    const twStyles = generateStyleFromExtraction("tw", tw, configByName.get("tw")!.config);
    expect(twStyles.classMap).toMatchInlineSnapshot(`
      {
          tw_padding_24: "tw_padding_24__1rxundp2",
          tw_borderRadius_lg: "tw_borderRadius_lg__1rxundp3",
      }
    `);
    generateStyleResults.add(twStyles);

    const { cssMap } = ctx.getCss();
    expect(cssMap.get("test/jit-style.test.ts")).toMatchInlineSnapshot(`
      ".minimalSprinkles_color_brand__1rxundp0 {
        color: var(--brand);
      }
      .minimalSprinkles_color_red\\.100__1rxundp1 {
        color: red.100;
      }
      .tw_padding_24__1rxundp2 {
        padding: 24px;
      }
      .tw_borderRadius_lg__1rxundp3 {
        border-radius: 0.5rem;
      }"
    `);

    transformStyleNodes(generateStyleResults, magicStr);

    expect(magicStr.toString()).toMatchInlineSnapshot(`
      "
          const minimalSprinkles = defineProperties({
              properties: {
                  color: {
                      brand: "var(--brand)",
                  }
              },
          });

          const tokens = {
              spacing: {
                  4: "4px",
                  8: "8px",
                  12: "12px",
                  16: "16px",
                  20: "20px",
                  24: "24px",
              },
              radii: {
                  none: "0",
                  sm: "0.125rem",
                  base: "0.25rem",
                  md: "0.375rem",
                  lg: "0.5rem",
                  xl: "0.75rem",
                  "2xl": "1rem",
                  "3xl": "1.5rem",
                  full: "9999px",
              },
          }

          const tw = defineProperties({
              properties: {
                  borderRadius: tokens.radii,
                  padding: tokens.spacing,
              },
              shorthands: {
                  p: ["padding"],
                  rounded: ["borderRadius"],
              },
          });

          export const MinimalSprinklesDemo = () => {
              return <div className={"minimalSprinkles_color_brand__1rxundp0"}>
                  <div className={["minimalSprinkles_color_red.100__1rxundp1", "tw_padding_24__1rxundp2 tw_borderRadius_lg__1rxundp3"].join(' ')}></div>
              </div>;
          };"
    `);

    endFileScope();
    ctx.removeAdapter();
});

const themeConfig = `const tokens = {
    colors: {
        "blue.50": "#ebf8ff",
        "blue.100": "#bee3f8",
        "blue.200": "#90cdf4",
        "blue.300": "#63b3ed",
        "blue.400": "#4299e1",
        "blue.500": "#3182ce",
        "blue.600": "#2b6cb0",
        "blue.700": "#2c5282",
        "blue.800": "#2a4365",
        "blue.900": "#1A365D",
        "red.50": "#FFF5F5",
        "red.100": "#FED7D7",
        "red.200": "#FEB2B2",
        "red.300": "#FC8181",
        "red.400": "#F56565",
        "red.500": "#E53E3E",
        "red.600": "#C53030",
        "red.700": "#9B2C2C",
        "red.800": "#822727",
        "red.900": "#63171B",
        "brand.50": "#F7FAFC",
        "brand.100": "#EFF6F8",
        "brand.200": "#D7E8EE",
        "brand.300": "#BFDAE4",
        "brand.400": "#90BFD0",
        "brand.500": "#60A3BC",
        "brand.600": "#5693A9",
        "brand.700": "#3A6271",
        "brand.800": "#2B4955",
        "brand.900": "#1D3138",
    },
    radii: {
        none: "0",
        sm: "0.125rem",
        base: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
    },
};

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
});`;

const codeSample = `
${themeConfig}

const className = tw({
    p: 24,
    rounded: "lg",
    bg: "blue.500",
    display: { dark: { hover: "table-footer-group" } },
    navItem: { hoverNotActive: { color: "brand.100" } },
    hover: {
        bg: "whitesmoke",
        borderColor: undefined,
        borderRadius: "2xl",
        color: "xxx".startsWith("xxx") ? "darkseagreen" : "red.200",
        w: "falsy".startsWith("xxx") ? "1/2" : "12px",
        padding: Math.random() > 0.5 ? "100px" : "4",
        d: { dark: { large: "flex" } },
        display: { light: "inline-flex" },
        backgroundColor: {
            dark: "blue.700",
            light: { large: "red.200", dark: "ThreeDHighlight" },
        },
    },
    dark: {
        p: 24,
        bg: "red.800",
        backgroundColor: "whitesmoke",
        hover: {
            color: "blue.600",
            d: {
                light: "flex",
                large: { small: "contents" },
            },
        },
    },
});`;

it("will generate multiple styles with nested conditions", () => {
    const sourceFile = project.createSourceFile("multiple.css.ts", codeSample);

    const extractDefs = extractFromCode(sourceFile, { functions: ["defineProperties"] });
    const queryList = (extractDefs.get("defineProperties") as FunctionNodesMap).queryList;

    const configByName = new Map<string, { query: QueryFnBox; config: GenericConfig }>();
    queryList.forEach((query) => {
        const from = query.fromNode();
        const declaration = from.getParentIfKindOrThrow(ts.SyntaxKind.VariableDeclaration);
        const nameNode = declaration.getNameNode();
        const name = nameNode.getText();
        configByName.set(name, { query, config: unbox(query.box.value[0]) as GenericConfig });
    });

    const ctx = createAdapterContext("debug");
    ctx.setAdapter();
    setFileScope("test/jit-style.test.ts");

    const extracted = extractFromCode(sourceFile, { functions: ["tw"] });
    const tw = extracted.get("tw")! as FunctionNodesMap;
    const twStyles = generateStyleFromExtraction("tw", tw, configByName.get("tw")!.config);

    const magicStr = new MagicString(sourceFile.getFullText());
    const generateStyleResults = new Set<ReturnType<typeof generateStyleFromExtraction>>();

    expect(twStyles.classMap.size).toMatchInlineSnapshot("22");
    expect(twStyles.classMap).toMatchInlineSnapshot(`
      {
          "tw_backgroundColor_blue.500": "tw_backgroundColor_blue.500__1rxundp0",
          tw_padding_24: "tw_padding_24__1rxundp1",
          tw_borderRadius_lg: "tw_borderRadius_lg__1rxundp2",
          "tw_display_dark_hover_table-footer-group": "tw_display_dark_hover_table-footer-group__1rxundp3",
          "tw_color_navItem_hoverNotActive_brand.100": "tw_color_navItem_hoverNotActive_brand.100__1rxundp4",
          tw_backgroundColor_hover_whitesmoke: "tw_backgroundColor_hover_whitesmoke__1rxundp5",
          tw_borderRadius_hover_2xl: "tw_borderRadius_hover_2xl__1rxundp6",
          tw_color_hover_darkseagreen: "tw_color_hover_darkseagreen__1rxundp7",
          tw_width_hover_12px: "tw_width_hover_12px__1rxundp8",
          tw_padding_hover_100px: "tw_padding_hover_100px__1rxundp9",
          tw_padding_hover_4: "tw_padding_hover_4__1rxundpa",
          tw_display_hover_dark_large_flex: "tw_display_hover_dark_large_flex__1rxundpb",
          "tw_display_hover_light_inline-flex": "tw_display_hover_light_inline-flex__1rxundpc",
          "tw_backgroundColor_hover_dark_blue.700": "tw_backgroundColor_hover_dark_blue.700__1rxundpd",
          "tw_backgroundColor_hover_light_large_red.200": "tw_backgroundColor_hover_light_large_red.200__1rxundpe",
          tw_backgroundColor_hover_light_dark_ThreeDHighlight:
              "tw_backgroundColor_hover_light_dark_ThreeDHighlight__1rxundpf",
          tw_padding_dark_24: "tw_padding_dark_24__1rxundpg",
          "tw_backgroundColor_dark_red.800": "tw_backgroundColor_dark_red.800__1rxundph",
          tw_backgroundColor_dark_whitesmoke: "tw_backgroundColor_dark_whitesmoke__1rxundpi",
          "tw_color_dark_hover_blue.600": "tw_color_dark_hover_blue.600__1rxundpj",
          tw_display_dark_hover_light_flex: "tw_display_dark_hover_light_flex__1rxundpk",
          tw_display_dark_hover_large_small_contents: "tw_display_dark_hover_large_small_contents__1rxundpl",
      }
    `);

    generateStyleResults.add(twStyles);
    transformStyleNodes(generateStyleResults, magicStr);

    expect(magicStr.toString()).toMatchInlineSnapshot(`
      "
      const tokens = {
          colors: {
              "blue.50": "#ebf8ff",
              "blue.100": "#bee3f8",
              "blue.200": "#90cdf4",
              "blue.300": "#63b3ed",
              "blue.400": "#4299e1",
              "blue.500": "#3182ce",
              "blue.600": "#2b6cb0",
              "blue.700": "#2c5282",
              "blue.800": "#2a4365",
              "blue.900": "#1A365D",
              "red.50": "#FFF5F5",
              "red.100": "#FED7D7",
              "red.200": "#FEB2B2",
              "red.300": "#FC8181",
              "red.400": "#F56565",
              "red.500": "#E53E3E",
              "red.600": "#C53030",
              "red.700": "#9B2C2C",
              "red.800": "#822727",
              "red.900": "#63171B",
              "brand.50": "#F7FAFC",
              "brand.100": "#EFF6F8",
              "brand.200": "#D7E8EE",
              "brand.300": "#BFDAE4",
              "brand.400": "#90BFD0",
              "brand.500": "#60A3BC",
              "brand.600": "#5693A9",
              "brand.700": "#3A6271",
              "brand.800": "#2B4955",
              "brand.900": "#1D3138",
          },
          radii: {
              none: "0",
              sm: "0.125rem",
              base: "0.25rem",
              md: "0.375rem",
              lg: "0.5rem",
              xl: "0.75rem",
              "2xl": "1rem",
              "3xl": "1.5rem",
              full: "9999px",
          },
      };

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

      const className = "tw_backgroundColor_blue.500__1rxundp0 tw_padding_24__1rxundp1 tw_borderRadius_lg__1rxundp2 tw_display_dark_hover_table-footer-group__1rxundp3 tw_color_navItem_hoverNotActive_brand.100__1rxundp4 tw_backgroundColor_hover_whitesmoke__1rxundp5 tw_borderRadius_hover_2xl__1rxundp6 tw_color_hover_darkseagreen__1rxundp7 tw_width_hover_12px__1rxundp8 tw_padding_hover_100px__1rxundp9 tw_padding_hover_4__1rxundpa tw_display_hover_dark_large_flex__1rxundpb tw_display_hover_light_inline-flex__1rxundpc tw_backgroundColor_hover_dark_blue.700__1rxundpd tw_backgroundColor_hover_light_large_red.200__1rxundpe tw_backgroundColor_hover_light_dark_ThreeDHighlight__1rxundpf tw_padding_dark_24__1rxundpg tw_backgroundColor_dark_red.800__1rxundph tw_backgroundColor_dark_whitesmoke__1rxundpi tw_color_dark_hover_blue.600__1rxundpj tw_display_dark_hover_light_flex__1rxundpk tw_display_dark_hover_large_small_contents__1rxundpl";"
    `);

    expect(ctx.getCss().cssMap.get("test/jit-style.test.ts")).toMatchInlineSnapshot(`
      ".tw_backgroundColor_blue\\.500__1rxundp0 {
        background-color: #3182ce;
      }
      .tw_padding_24__1rxundp1 {
        padding: 24px;
      }
      .tw_borderRadius_lg__1rxundp2 {
        border-radius: 0.5rem;
      }
      .dark .tw_display_dark_hover_table-footer-group__1rxundp3:hover {
        display: table-footer-group;
      }
      nav li > .tw_color_navItem_hoverNotActive_brand\\.100__1rxundp4:hover:not(:active) {
        color: #EFF6F8;
      }
       .tw_backgroundColor_hover_whitesmoke__1rxundp5:hover {
        background-color: whitesmoke;
      }
       .tw_borderRadius_hover_2xl__1rxundp6:hover {
        border-radius: 1rem;
      }
       .tw_color_hover_darkseagreen__1rxundp7:hover {
        color: darkseagreen;
      }
       .tw_width_hover_12px__1rxundp8:hover {
        width: 12px;
      }
       .tw_padding_hover_100px__1rxundp9:hover {
        padding: 100px;
      }
       .tw_padding_hover_4__1rxundpa:hover {
        padding: 4px;
      }
      .dark.large .tw_display_hover_dark_large_flex__1rxundpb:hover {
        display: flex;
      }
      .light .tw_display_hover_light_inline-flex__1rxundpc:hover {
        display: inline-flex;
      }
      .dark .tw_backgroundColor_hover_dark_blue\\.700__1rxundpd:hover {
        background-color: #2c5282;
      }
      .light.large .tw_backgroundColor_hover_light_large_red\\.200__1rxundpe:hover {
        background-color: #FEB2B2;
      }
      .light.dark .tw_backgroundColor_hover_light_dark_ThreeDHighlight__1rxundpf:hover {
        background-color: ThreeDHighlight;
      }
      .dark .tw_padding_dark_24__1rxundpg {
        padding: 24px;
      }
      .dark .tw_backgroundColor_dark_red\\.800__1rxundph {
        background-color: #822727;
      }
      .dark .tw_backgroundColor_dark_whitesmoke__1rxundpi {
        background-color: whitesmoke;
      }
      .dark .tw_color_dark_hover_blue\\.600__1rxundpj:hover {
        color: #2b6cb0;
      }
      .dark.light .tw_display_dark_hover_light_flex__1rxundpk:hover {
        display: flex;
      }
      .dark.large.small .tw_display_dark_hover_large_small_contents__1rxundpl:hover {
        display: contents;
      }"
    `);

    endFileScope();
    ctx.removeAdapter();
});

it("will generate multiple styles with nested conditions - grouped", () => {
    const sourceFile = project.createSourceFile("multiple.grouped.css.ts", codeSample);

    const extractDefs = extractFromCode(sourceFile, { functions: ["defineProperties"] });
    const queryList = (extractDefs.get("defineProperties") as FunctionNodesMap).queryList;

    const configByName = new Map<string, { query: QueryFnBox; config: GenericConfig }>();
    queryList.forEach((query) => {
        const from = query.fromNode();
        const declaration = from.getParentIfKindOrThrow(ts.SyntaxKind.VariableDeclaration);
        const nameNode = declaration.getNameNode();
        const name = nameNode.getText();
        configByName.set(name, { query, config: unbox(query.box.value[0]) as GenericConfig });
    });

    const ctx = createAdapterContext("debug");
    ctx.setAdapter();
    setFileScope("test/jit-style.test.ts");

    const extracted = extractFromCode(sourceFile, { functions: ["tw"] });
    const tw = extracted.get("tw")! as FunctionNodesMap;
    const twStyles = generateStyleFromExtraction("tw", tw, configByName.get("tw")!.config, "grouped");

    const magicStr = new MagicString(sourceFile.getFullText());
    const generateStyleResults = new Set<ReturnType<typeof generateStyleFromExtraction>>();

    expect(twStyles.classMap.size).toMatchInlineSnapshot("1");
    expect(twStyles.classMap).toMatchInlineSnapshot(`
      {
          _1rxundp0: "_1rxundp0",
      }
    `);

    generateStyleResults.add(twStyles);
    transformStyleNodes(generateStyleResults, magicStr);

    expect(magicStr.toString()).toMatchInlineSnapshot(`
      "
      const tokens = {
          colors: {
              "blue.50": "#ebf8ff",
              "blue.100": "#bee3f8",
              "blue.200": "#90cdf4",
              "blue.300": "#63b3ed",
              "blue.400": "#4299e1",
              "blue.500": "#3182ce",
              "blue.600": "#2b6cb0",
              "blue.700": "#2c5282",
              "blue.800": "#2a4365",
              "blue.900": "#1A365D",
              "red.50": "#FFF5F5",
              "red.100": "#FED7D7",
              "red.200": "#FEB2B2",
              "red.300": "#FC8181",
              "red.400": "#F56565",
              "red.500": "#E53E3E",
              "red.600": "#C53030",
              "red.700": "#9B2C2C",
              "red.800": "#822727",
              "red.900": "#63171B",
              "brand.50": "#F7FAFC",
              "brand.100": "#EFF6F8",
              "brand.200": "#D7E8EE",
              "brand.300": "#BFDAE4",
              "brand.400": "#90BFD0",
              "brand.500": "#60A3BC",
              "brand.600": "#5693A9",
              "brand.700": "#3A6271",
              "brand.800": "#2B4955",
              "brand.900": "#1D3138",
          },
          radii: {
              none: "0",
              sm: "0.125rem",
              base: "0.25rem",
              md: "0.375rem",
              lg: "0.5rem",
              xl: "0.75rem",
              "2xl": "1rem",
              "3xl": "1.5rem",
              full: "9999px",
          },
      };

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

      const className = "_1rxundp0";"
    `);

    expect(ctx.getCss().cssMap.get("test/jit-style.test.ts")).toMatchInlineSnapshot(`
      "._1rxundp0 {
        background-color: #3182ce;
        padding: 24px;
        border-radius: 0.5rem;
      }
      .dark ._1rxundp0:hover {
        display: table-footer-group;
        background-color: #2c5282;
        color: #2b6cb0;
      }
      nav li > ._1rxundp0:hover:not(:active) {
        color: #EFF6F8;
      }
       ._1rxundp0:hover {
        background-color: whitesmoke;
        border-radius: 1rem;
        color: darkseagreen;
        width: 12px;
        padding: 4px;
      }
      .dark.large ._1rxundp0:hover {
        display: flex;
      }
      .light ._1rxundp0:hover {
        display: inline-flex;
      }
      .light.large ._1rxundp0:hover {
        background-color: #FEB2B2;
      }
      .light.dark ._1rxundp0:hover {
        background-color: ThreeDHighlight;
      }
      .dark ._1rxundp0 {
        padding: 24px;
        background-color: whitesmoke;
      }
      .dark.light ._1rxundp0:hover {
        display: flex;
      }
      .dark.large.small ._1rxundp0:hover {
        display: contents;
      }"
    `);

    endFileScope();
    ctx.removeAdapter();
});

it("minimal example with <Box /> component", () => {
    const sourceFile = project.createSourceFile(
        "with-box.tsx",
        `
    ${themeConfig}

    const Box = ({ _styled, className, ...props }) => {
        return <div {...props} className={[_styled, className ?? ''].join(' ')} />;
    };

    const defaultStyle = { fontSize: "12px", fontWeight: "bold" }

    const Demo = () => {
        return (
            <Box {...{ flexDirection: "column", ...defaultStyle }} display="flex" padding={4} backgroundColor="blue.500" borderRadius="lg" />
        );
    }
    `
    );

    const extractDefs = extractFromCode(sourceFile, { functions: ["defineProperties"] });
    const queryList = (extractDefs.get("defineProperties") as FunctionNodesMap).queryList;

    const configByName = new Map<string, { query: QueryFnBox; config: GenericConfig }>();
    queryList.forEach((query) => {
        const from = query.fromNode();
        const declaration = from.getParentIfKindOrThrow(ts.SyntaxKind.VariableDeclaration);
        const nameNode = declaration.getNameNode();
        const name = nameNode.getText();
        configByName.set(name, { query, config: unbox(query.box.value[0]) as GenericConfig });
    });

    const ctx = createAdapterContext("debug");
    ctx.setAdapter();
    setFileScope("test/jit-style.test.ts");

    const name = "Box";
    const extractResult = extractFromCode(sourceFile, { components: [name] });
    const extracted = extractResult.get(name)! as ComponentNodesMap;

    const conf = configByName.get("tw")!;
    const boxStyles = generateStyleFromExtraction(name, extracted, conf.config);

    const magicStr = new MagicString(sourceFile.getFullText());
    const generateStyleResults = new Set<ReturnType<typeof generateStyleFromExtraction>>();

    expect(boxStyles.classMap.size).toMatchInlineSnapshot("4");
    expect(boxStyles.classMap).toMatchInlineSnapshot(`
      {
          Box_display_flex: "Box_display_flex__1rxundp0",
          Box_padding_4: "Box_padding_4__1rxundp1",
          "Box_backgroundColor_blue.500": "Box_backgroundColor_blue.500__1rxundp2",
          Box_borderRadius_lg: "Box_borderRadius_lg__1rxundp3",
      }
    `);

    generateStyleResults.add(boxStyles);
    transformStyleNodes(generateStyleResults, magicStr);

    expect(magicStr.toString()).toMatchInlineSnapshot(`
      "
          const tokens = {
          colors: {
              "blue.50": "#ebf8ff",
              "blue.100": "#bee3f8",
              "blue.200": "#90cdf4",
              "blue.300": "#63b3ed",
              "blue.400": "#4299e1",
              "blue.500": "#3182ce",
              "blue.600": "#2b6cb0",
              "blue.700": "#2c5282",
              "blue.800": "#2a4365",
              "blue.900": "#1A365D",
              "red.50": "#FFF5F5",
              "red.100": "#FED7D7",
              "red.200": "#FEB2B2",
              "red.300": "#FC8181",
              "red.400": "#F56565",
              "red.500": "#E53E3E",
              "red.600": "#C53030",
              "red.700": "#9B2C2C",
              "red.800": "#822727",
              "red.900": "#63171B",
              "brand.50": "#F7FAFC",
              "brand.100": "#EFF6F8",
              "brand.200": "#D7E8EE",
              "brand.300": "#BFDAE4",
              "brand.400": "#90BFD0",
              "brand.500": "#60A3BC",
              "brand.600": "#5693A9",
              "brand.700": "#3A6271",
              "brand.800": "#2B4955",
              "brand.900": "#1D3138",
          },
          radii: {
              none: "0",
              sm: "0.125rem",
              base: "0.25rem",
              md: "0.375rem",
              lg: "0.5rem",
              xl: "0.75rem",
              "2xl": "1rem",
              "3xl": "1.5rem",
              full: "9999px",
          },
      };

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

          const Box = ({ _styled, className, ...props }) => {
              return <div {...props} className={[_styled, className ?? ''].join(' ')} />;
          };

          const defaultStyle = { fontSize: "12px", fontWeight: "bold" }

          const Demo = () => {
              return (
                  <Box _styled="Box_display_flex__1rxundp0 Box_padding_4__1rxundp1 Box_backgroundColor_blue.500__1rxundp2 Box_borderRadius_lg__1rxundp3" />
              );
          }
          "
    `);

    expect(ctx.getCss().cssMap.get("test/jit-style.test.ts")).toMatchInlineSnapshot(`
      ".Box_display_flex__1rxundp0 {
        display: flex;
      }
      .Box_padding_4__1rxundp1 {
        padding: 4px;
      }
      .Box_backgroundColor_blue\\.500__1rxundp2 {
        background-color: #3182ce;
      }
      .Box_borderRadius_lg__1rxundp3 {
        border-radius: 0.5rem;
      }"
    `);

    endFileScope();
    ctx.removeAdapter();
});

it("minimal example with global style", () => {
    // css({ fontSize: "24px", backgroundColor: "green" });

    const sourceFile = project.createSourceFile(
        "global-style.tsx",
        `
        const css = defineProperties({
            conditions: {
                small: { selector: ".small &" },
                large: { selector: ".large &" },
                hover: { selector: "&:hover" },
                navItem: { selector: 'nav li > &' },
                hoverNotActive: { selector: '&:hover:not(:active)' }
            }
          });

        const localClassName = css({
            fontSize: { small: "8px", large: "20px" },
            navItem: { backgroundColor: "red", fontSize: "16px" },
            backgroundColor: "green",
            display: "flex",
            color: "blue",
        });
        const localClassNameGrouped = css({
            fontSize: { small: "8px", large: "20px" },
            navItem: { backgroundColor: "red", fontSize: "16px" },
            backgroundColor: "green",
            display: "flex",
            color: "blue",
        }, { mode: "grouped" });


        // globalStyle
        css({
            fontSize: { small: "8px", large: "20px" },
            navItem: { backgroundColor: "red", fontSize: "16px" },
            backgroundColor: "green",
            display: "flex",
            color: "blue",
        }, { selector: ":root" });

        css({ display: "grid", fontWeight: "bold" }, { selector: "body" } );

        const darkVars = {
            "var(--color-mainBg__1du39r70)": "#39539b",
            "var(--color-secondaryBg__1du39r71)": "#324989",
            "var(--color-text__1du39r72)": "#63b3ed",
            "var(--color-bg__1du39r73)": "#8297d1",
            "var(--color-bgSecondary__1du39r74)": "#2b3f76",
            "var(--color-bgHover__1du39r75)": "#324989"
        } as const;

        css({ colorScheme: "dark", vars: darkVars }, { selector: ".dark" } );
        const darkClassName = css({ colorScheme: "dark", vars: darkVars });
    `
    );

    const extractDefs = extractFromCode(sourceFile, { functions: ["defineProperties"] });
    const queryList = (extractDefs.get("defineProperties") as FunctionNodesMap).queryList;

    const configByName = new Map<string, { query: QueryFnBox; config: GenericConfig }>();
    queryList.forEach((query) => {
        const from = query.fromNode();
        const declaration = from.getParentIfKindOrThrow(ts.SyntaxKind.VariableDeclaration);
        const nameNode = declaration.getNameNode();
        const name = nameNode.getText();
        configByName.set(name, { query, config: unbox(query.box.value[0]) as GenericConfig });
    });

    const ctx = createAdapterContext("debug");
    ctx.setAdapter();
    setFileScope("test/jit-style.test.ts");

    const name = "css";
    const extractResult = extractFromCode(sourceFile, { functions: [name] });
    const extracted = extractResult.get(name)! as ComponentNodesMap;

    console.log({ extractDefs, extractResult, configByName });
    const conf = configByName.get("css")!;
    const globalStyles = generateStyleFromExtraction(name, extracted, conf.config);

    expect(globalStyles.classMap.size).toMatchInlineSnapshot("9");
    expect(globalStyles.classMap).toMatchInlineSnapshot(`
      {
          css_fontSize_small_8px: "css_fontSize_small_8px__1rxundp0",
          css_fontSize_large_20px: "css_fontSize_large_20px__1rxundp1",
          css_backgroundColor_navItem_red: "css_backgroundColor_navItem_red__1rxundp2",
          css_fontSize_navItem_16px: "css_fontSize_navItem_16px__1rxundp3",
          css_backgroundColor_green: "css_backgroundColor_green__1rxundp4",
          css_display_flex: "css_display_flex__1rxundp5",
          css_color_blue: "css_color_blue__1rxundp6",
          _1rxundp7: "_1rxundp7",
          css_colorScheme_dark: "css_colorScheme_dark__1rxundp8",
      }
    `);

    const css = ctx.getCss();

    const magicStr = new MagicString(sourceFile.getFullText());
    const generateStyleResults = new Set<ReturnType<typeof generateStyleFromExtraction>>();
    generateStyleResults.add(globalStyles);
    transformStyleNodes(generateStyleResults, magicStr);

    expect(magicStr.toString()).toMatchInlineSnapshot(`
      "
              const css = defineProperties({
                  conditions: {
                      small: { selector: ".small &" },
                      large: { selector: ".large &" },
                      hover: { selector: "&:hover" },
                      navItem: { selector: 'nav li > &' },
                      hoverNotActive: { selector: '&:hover:not(:active)' }
                  }
                });

              const localClassName = "css_fontSize_small_8px__1rxundp0 css_fontSize_large_20px__1rxundp1 css_backgroundColor_navItem_red__1rxundp2 css_fontSize_navItem_16px__1rxundp3 css_backgroundColor_green__1rxundp4 css_display_flex__1rxundp5 css_color_blue__1rxundp6";
              const localClassNameGrouped = "_1rxundp7";;;

              const darkVars = {
                  "var(--color-mainBg__1du39r70)": "#39539b",
                  "var(--color-secondaryBg__1du39r71)": "#324989",
                  "var(--color-text__1du39r72)": "#63b3ed",
                  "var(--color-bg__1du39r73)": "#8297d1",
                  "var(--color-bgSecondary__1du39r74)": "#2b3f76",
                  "var(--color-bgHover__1du39r75)": "#324989"
              } as const;;
              const darkClassName = "css_colorScheme_dark__1rxundp8";
          "
    `);

    expect(css.cssMap.get("test/jit-style.test.ts")).toMatchInlineSnapshot(`
      ".small .css_fontSize_small_8px__1rxundp0 {
        font-size: 8px;
      }
      .large .css_fontSize_large_20px__1rxundp1 {
        font-size: 20px;
      }
      nav li > .css_backgroundColor_navItem_red__1rxundp2 {
        background-color: red;
      }
      nav li > .css_fontSize_navItem_16px__1rxundp3 {
        font-size: 16px;
      }
      .css_backgroundColor_green__1rxundp4 {
        background-color: green;
      }
      .css_display_flex__1rxundp5 {
        display: flex;
      }
      .css_color_blue__1rxundp6 {
        color: blue;
      }
      ._1rxundp7 {
        background-color: green;
        display: flex;
        color: blue;
      }
      .small ._1rxundp7 {
        font-size: 8px;
      }
      .large ._1rxundp7 {
        font-size: 20px;
      }
      nav li > ._1rxundp7 {
        background-color: red;
        font-size: 16px;
      }
      :root {
        background-color: green;
        display: flex;
        color: blue;
      }
      :root.small {
        font-size: 8px;
      }
      :root.large {
        font-size: 20px;
      }
      :root nav li > * {
        background-color: red;
        font-size: 16px;
      }
      body {
        display: grid;
        font-weight: bold;
      }
      .dark {
        --color-mainBg__1du39r70: #39539b;
        --color-secondaryBg__1du39r71: #324989;
        --color-text__1du39r72: #63b3ed;
        --color-bg__1du39r73: #8297d1;
        --color-bgSecondary__1du39r74: #2b3f76;
        --color-bgHover__1du39r75: #324989;
        color-scheme: dark;
      }
      .css_colorScheme_dark__1rxundp8 {
        color-scheme: dark;
      }"
    `);

    endFileScope();
    ctx.removeAdapter();
});
