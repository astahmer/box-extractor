import type { BoxNodesMap, ExtractOptions } from "@box-extractor/core";
import { extract } from "@box-extractor/core";
import { Project, SourceFile, ts } from "ts-morph";
import { afterEach, expect, it } from "vitest";
import { defineProperties } from "../src/defineProperties";

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

const extractFromCode = (code: string | SourceFile, options: Partial<ExtractOptions>) => {
    const extractMap = new Map() as BoxNodesMap;
    const fileName = `file${fileCount++}.tsx`;
    sourceFile =
        typeof code === "string" ? project.createSourceFile(fileName, code, { scriptKind: ts.ScriptKind.TSX }) : code;
    return extract({ ast: sourceFile, extractMap, ...options });
};

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

it("types are fine", () => {
    const tw = defineProperties({
        conditions: {
            small: { selector: ".small &" },
            large: { selector: ".large &" },
            dark: { selector: ".dark &" },
            light: { selector: ".light &" },
            hover: { selector: "&:hover" },
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

    const atomicClass = defineProperties();

    atomicClass({
        accentColor: "mediumaquamarine",
        display: "flex",
        // @ts-expect-error
        azazas: 123, // invalid css prop name
    });

    const atomicClassWithShorthands = defineProperties({
        shorthands: {
            d: ["display"],
            w: ["width"],
            bg: ["backgroundColor"],
        },
    });

    defineProperties({
        // @ts-expect-error
        shorthands: {
            d: ["display"],
            w: ["width"],
            bg: ["backgroundColor"],
            shorthand: ["invalidProp"], // invalid css prop name
        },
    });

    defineProperties({
        properties: {
            backgroundColor: tokens.colors,
        },
        shorthands: {
            bg: ["backgroundColor"],
        },
    });

    defineProperties({
        // @ts-expect-error
        properties: {
            backgroundColor: tokens.colors,
        },
        shorthands: {
            bg: ["backgroundColor"],
            w: ["width"], // width is not defined as property
        },
    });

    atomicClassWithShorthands({
        d: "flex",
        w: "100%",
        height: "100vh",
    });

    const atomicClassWithShorthandsAndConditions = defineProperties({
        conditions: {
            small: { selector: ".small &" },
            large: { selector: ".large &" },
            dark: { selector: ".dark &" },
            light: { selector: ".light &" },
            hover: { selector: "&:hover" },
        },
        shorthands: {
            d: ["display"],
            w: ["width"],
            bg: ["backgroundColor"],
        },
    });

    atomicClassWithShorthandsAndConditions({
        d: "flex",
        w: {
            hover: {
                dark: "100%",
            },
        },
        // @ts-expect-error
        invalidCssProp: "100%", // invalid css prop name
        height: "100vh",
        hover: {
            flexDirection: "column",
            bg: "black",
        },
    });

    const all = defineProperties({
        conditions: {
            small: { selector: ".small &" },
            large: { selector: ".large &" },
            dark: { selector: ".dark &" },
            light: { selector: ".light &" },
            hover: { selector: "&:hover" },
        },
        properties: {
            display: true,
            color: tokens.colors,
            backgroundColor: tokens.colors,
            borderColor: tokens.colors,
            borderRadius: tokens.radii,
        },
        shorthands: {
            d: ["display"],
        },
    });

    all({
        d: {
            dark: {
                hover: "flex",
            },
            light: "grid",
        },
    });

    tw({
        bg: "blue.500",
        backgroundColor: { dark: "blue.700", light: { large: "red.200" } },
        rounded: "lg",
        display: { dark: { hover: "table-footer-group" } },
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
            borderColor: "whitesmoke",
            bg: "red.800",
            hover: {
                color: "blue.600",
                d: {
                    light: "flex",
                    large: { small: "contents" },
                },
            },
        },
    });

    expect(
        extractFromCode(
            `
        import { tw } from "./tw";

        const Demo = () => {
            return (
                <div className={tw({
                    p: 24,
                    rounded: "lg",
                    bg: "blue.500",
                    display: { dark: { hover: "table-footer-group" } },
                    hover: {
                        bg: "whitesmoke",
                        borderColor: undefined,
                        borderRadius: "2xl",
                        color: "xxx".startsWith("xxx") ? "darkseagreen" : "red.200",
                        d: { dark: { large: "flex" } },
                        display: { light: "inline-flex" },
                        backgroundColor: {
                            dark: "blue.700",
                            light: { large: "red.200", dark: "ThreeDHighlight" },
                        },
                    },
                    dark: {
                        bg: "red.800",
                        hover: {
                            color: "blue.600",
                            d: {
                                light: "flex",
                                large: { small: "contents" },
                            },
                        },
                    },
                })} />
            )
        }
    `,
            { functions: ["tw"] }
        )
    ).toMatchInlineSnapshot(`
      {
          tw: {
              kind: "function",
              nodesByProp: {
                  p: [
                      {
                          stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "NumericLiteral"],
                          type: "literal",
                          node: "NumericLiteral",
                          value: "24",
                          kind: "string",
                      },
                  ],
                  rounded: [
                      {
                          stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "lg",
                          kind: "string",
                      },
                  ],
                  bg: [
                      {
                          stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "StringLiteral"],
                          type: "literal",
                          node: "StringLiteral",
                          value: "blue.500",
                          kind: "string",
                      },
                  ],
                  display: [
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
                              dark: [
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
                                          hover: [
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
                                                  value: "table-footer-group",
                                                  kind: "string",
                                              },
                                          ],
                                      },
                                  },
                              ],
                          },
                      },
                  ],
                  hover: [
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
                              bg: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "StringLiteral",
                                      ],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "whitesmoke",
                                      kind: "string",
                                  },
                              ],
                              borderColor: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "Identifier",
                                      ],
                                      type: "literal",
                                      node: "Identifier",
                                      kind: "undefined",
                                  },
                              ],
                              borderRadius: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "StringLiteral",
                                      ],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "2xl",
                                      kind: "string",
                                  },
                              ],
                              color: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ConditionalExpression",
                                      ],
                                      type: "literal",
                                      node: "ConditionalExpression",
                                      value: "darkseagreen",
                                      kind: "string",
                                  },
                              ],
                              d: [
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
                                          dark: [
                                              {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                  ],
                                                  type: "map",
                                                  node: "ObjectLiteralExpression",
                                                  value: {
                                                      large: [
                                                          {
                                                              stack: [
                                                                  "CallExpression",
                                                                  "ObjectLiteralExpression",
                                                                  "PropertyAssignment",
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
                                                              value: "flex",
                                                              kind: "string",
                                                          },
                                                      ],
                                                  },
                                              },
                                          ],
                                      },
                                  },
                              ],
                              display: [
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
                                          light: [
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
                                                  value: "inline-flex",
                                                  kind: "string",
                                              },
                                          ],
                                      },
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
                                          "ObjectLiteralExpression",
                                      ],
                                      type: "map",
                                      node: "ObjectLiteralExpression",
                                      value: {
                                          dark: [
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
                                                  value: "blue.700",
                                                  kind: "string",
                                              },
                                          ],
                                          light: [
                                              {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                  ],
                                                  type: "map",
                                                  node: "ObjectLiteralExpression",
                                                  value: {
                                                      large: [
                                                          {
                                                              stack: [
                                                                  "CallExpression",
                                                                  "ObjectLiteralExpression",
                                                                  "PropertyAssignment",
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
                                                              value: "red.200",
                                                              kind: "string",
                                                          },
                                                      ],
                                                      dark: [
                                                          {
                                                              stack: [
                                                                  "CallExpression",
                                                                  "ObjectLiteralExpression",
                                                                  "PropertyAssignment",
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
                                                              value: "ThreeDHighlight",
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
                  dark: [
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
                              bg: [
                                  {
                                      stack: [
                                          "CallExpression",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "ObjectLiteralExpression",
                                          "PropertyAssignment",
                                          "StringLiteral",
                                      ],
                                      type: "literal",
                                      node: "StringLiteral",
                                      value: "red.800",
                                      kind: "string",
                                  },
                              ],
                              hover: [
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
                                          color: [
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
                                                  value: "blue.600",
                                                  kind: "string",
                                              },
                                          ],
                                          d: [
                                              {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                  ],
                                                  type: "map",
                                                  node: "ObjectLiteralExpression",
                                                  value: {
                                                      light: [
                                                          {
                                                              stack: [
                                                                  "CallExpression",
                                                                  "ObjectLiteralExpression",
                                                                  "PropertyAssignment",
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
                                                              value: "flex",
                                                              kind: "string",
                                                          },
                                                      ],
                                                      large: [
                                                          {
                                                              stack: [
                                                                  "CallExpression",
                                                                  "ObjectLiteralExpression",
                                                                  "PropertyAssignment",
                                                                  "ObjectLiteralExpression",
                                                                  "PropertyAssignment",
                                                                  "ObjectLiteralExpression",
                                                                  "PropertyAssignment",
                                                                  "ObjectLiteralExpression",
                                                                  "PropertyAssignment",
                                                                  "ObjectLiteralExpression",
                                                              ],
                                                              type: "map",
                                                              node: "ObjectLiteralExpression",
                                                              value: {
                                                                  small: [
                                                                      {
                                                                          stack: [
                                                                              "CallExpression",
                                                                              "ObjectLiteralExpression",
                                                                              "PropertyAssignment",
                                                                              "ObjectLiteralExpression",
                                                                              "PropertyAssignment",
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
                                                                          value: "contents",
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
                  ],
              },
              queryList: [
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
                                      bg: [
                                          {
                                              stack: [
                                                  "CallExpression",
                                                  "ObjectLiteralExpression",
                                                  "PropertyAssignment",
                                                  "StringLiteral",
                                              ],
                                              type: "literal",
                                              node: "StringLiteral",
                                              value: "blue.500",
                                              kind: "string",
                                          },
                                      ],
                                      display: [
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
                                                  dark: [
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
                                                              hover: [
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
                                                                      value: "table-footer-group",
                                                                      kind: "string",
                                                                  },
                                                              ],
                                                          },
                                                      },
                                                  ],
                                              },
                                          },
                                      ],
                                      hover: [
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
                                                  bg: [
                                                      {
                                                          stack: [
                                                              "CallExpression",
                                                              "ObjectLiteralExpression",
                                                              "PropertyAssignment",
                                                              "ObjectLiteralExpression",
                                                              "PropertyAssignment",
                                                              "StringLiteral",
                                                          ],
                                                          type: "literal",
                                                          node: "StringLiteral",
                                                          value: "whitesmoke",
                                                          kind: "string",
                                                      },
                                                  ],
                                                  borderColor: [
                                                      {
                                                          stack: [
                                                              "CallExpression",
                                                              "ObjectLiteralExpression",
                                                              "PropertyAssignment",
                                                              "ObjectLiteralExpression",
                                                              "PropertyAssignment",
                                                              "Identifier",
                                                          ],
                                                          type: "literal",
                                                          node: "Identifier",
                                                          kind: "undefined",
                                                      },
                                                  ],
                                                  borderRadius: [
                                                      {
                                                          stack: [
                                                              "CallExpression",
                                                              "ObjectLiteralExpression",
                                                              "PropertyAssignment",
                                                              "ObjectLiteralExpression",
                                                              "PropertyAssignment",
                                                              "StringLiteral",
                                                          ],
                                                          type: "literal",
                                                          node: "StringLiteral",
                                                          value: "2xl",
                                                          kind: "string",
                                                      },
                                                  ],
                                                  color: [
                                                      {
                                                          stack: [
                                                              "CallExpression",
                                                              "ObjectLiteralExpression",
                                                              "PropertyAssignment",
                                                              "ObjectLiteralExpression",
                                                              "PropertyAssignment",
                                                              "ConditionalExpression",
                                                          ],
                                                          type: "literal",
                                                          node: "ConditionalExpression",
                                                          value: "darkseagreen",
                                                          kind: "string",
                                                      },
                                                  ],
                                                  d: [
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
                                                              dark: [
                                                                  {
                                                                      stack: [
                                                                          "CallExpression",
                                                                          "ObjectLiteralExpression",
                                                                          "PropertyAssignment",
                                                                          "ObjectLiteralExpression",
                                                                          "PropertyAssignment",
                                                                          "ObjectLiteralExpression",
                                                                          "PropertyAssignment",
                                                                          "ObjectLiteralExpression",
                                                                      ],
                                                                      type: "map",
                                                                      node: "ObjectLiteralExpression",
                                                                      value: {
                                                                          large: [
                                                                              {
                                                                                  stack: [
                                                                                      "CallExpression",
                                                                                      "ObjectLiteralExpression",
                                                                                      "PropertyAssignment",
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
                                                                                  value: "flex",
                                                                                  kind: "string",
                                                                              },
                                                                          ],
                                                                      },
                                                                  },
                                                              ],
                                                          },
                                                      },
                                                  ],
                                                  display: [
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
                                                              light: [
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
                                                                      value: "inline-flex",
                                                                      kind: "string",
                                                                  },
                                                              ],
                                                          },
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
                                                              "ObjectLiteralExpression",
                                                          ],
                                                          type: "map",
                                                          node: "ObjectLiteralExpression",
                                                          value: {
                                                              dark: [
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
                                                                      value: "blue.700",
                                                                      kind: "string",
                                                                  },
                                                              ],
                                                              light: [
                                                                  {
                                                                      stack: [
                                                                          "CallExpression",
                                                                          "ObjectLiteralExpression",
                                                                          "PropertyAssignment",
                                                                          "ObjectLiteralExpression",
                                                                          "PropertyAssignment",
                                                                          "ObjectLiteralExpression",
                                                                          "PropertyAssignment",
                                                                          "ObjectLiteralExpression",
                                                                      ],
                                                                      type: "map",
                                                                      node: "ObjectLiteralExpression",
                                                                      value: {
                                                                          large: [
                                                                              {
                                                                                  stack: [
                                                                                      "CallExpression",
                                                                                      "ObjectLiteralExpression",
                                                                                      "PropertyAssignment",
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
                                                                                  value: "red.200",
                                                                                  kind: "string",
                                                                              },
                                                                          ],
                                                                          dark: [
                                                                              {
                                                                                  stack: [
                                                                                      "CallExpression",
                                                                                      "ObjectLiteralExpression",
                                                                                      "PropertyAssignment",
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
                                                                                  value: "ThreeDHighlight",
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
                                      dark: [
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
                                                  bg: [
                                                      {
                                                          stack: [
                                                              "CallExpression",
                                                              "ObjectLiteralExpression",
                                                              "PropertyAssignment",
                                                              "ObjectLiteralExpression",
                                                              "PropertyAssignment",
                                                              "StringLiteral",
                                                          ],
                                                          type: "literal",
                                                          node: "StringLiteral",
                                                          value: "red.800",
                                                          kind: "string",
                                                      },
                                                  ],
                                                  hover: [
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
                                                              color: [
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
                                                                      value: "blue.600",
                                                                      kind: "string",
                                                                  },
                                                              ],
                                                              d: [
                                                                  {
                                                                      stack: [
                                                                          "CallExpression",
                                                                          "ObjectLiteralExpression",
                                                                          "PropertyAssignment",
                                                                          "ObjectLiteralExpression",
                                                                          "PropertyAssignment",
                                                                          "ObjectLiteralExpression",
                                                                          "PropertyAssignment",
                                                                          "ObjectLiteralExpression",
                                                                      ],
                                                                      type: "map",
                                                                      node: "ObjectLiteralExpression",
                                                                      value: {
                                                                          light: [
                                                                              {
                                                                                  stack: [
                                                                                      "CallExpression",
                                                                                      "ObjectLiteralExpression",
                                                                                      "PropertyAssignment",
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
                                                                                  value: "flex",
                                                                                  kind: "string",
                                                                              },
                                                                          ],
                                                                          large: [
                                                                              {
                                                                                  stack: [
                                                                                      "CallExpression",
                                                                                      "ObjectLiteralExpression",
                                                                                      "PropertyAssignment",
                                                                                      "ObjectLiteralExpression",
                                                                                      "PropertyAssignment",
                                                                                      "ObjectLiteralExpression",
                                                                                      "PropertyAssignment",
                                                                                      "ObjectLiteralExpression",
                                                                                      "PropertyAssignment",
                                                                                      "ObjectLiteralExpression",
                                                                                  ],
                                                                                  type: "map",
                                                                                  node: "ObjectLiteralExpression",
                                                                                  value: {
                                                                                      small: [
                                                                                          {
                                                                                              stack: [
                                                                                                  "CallExpression",
                                                                                                  "ObjectLiteralExpression",
                                                                                                  "PropertyAssignment",
                                                                                                  "ObjectLiteralExpression",
                                                                                                  "PropertyAssignment",
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
                                                                                              value: "contents",
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
                                      ],
                                  },
                              },
                          ],
                      },
                  },
              ],
          },
      }
    `);

    // https://twitter.com/markdalgleish/status/1615106542298365957
    tw({
        p: 24,
        rounded: "lg",
        bg: "blue.500",
        hover: { bg: "blue.700" },
        dark: {
            bg: "red.800",
            hover: { bg: "red.800" },
        },
    });

    // should error
    tw({
        dark: {
            // @ts-expect-error
            dark: { display: "flex" },
        },
    });
    tw({
        display: {
            dark: {
                // cant nest using same condition
                // @ts-expect-error
                dark: "flex",
            },
        },
    });
});
