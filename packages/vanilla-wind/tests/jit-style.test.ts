import {
    ExtractResultByName,
    ExtractedComponentResult,
    extract,
    ExtractOptions,
    ExtractedFunctionResult,
    ExtractedFunctionInstance,
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
    const extractMap = new Map() as ExtractResultByName;
    const fileName = `file${fileCount++}.tsx`;
    sourceFile =
        typeof code === "string" ? project.createSourceFile(fileName, code, { scriptKind: ts.ScriptKind.TSX }) : code;
    const extracted = extract({ ast: sourceFile, extractMap, ...options });
    // console.dir({ test: true, usedMap, extracted }, { depth: null });
    return extracted;
};

it("minimal atomic local class", () => {
    const sourceFile = project.createSourceFile(
        "minimal-atomic-local.ts",
        `
        const atomicLocal = defineProperties({
            conditions: {
                small: { selector: ".small &" },
                hover: { selector: "&:hover" },
                navItem: { selector: 'nav li > &' },
            },
            properties: {
                backgroundColor: {
                    primary: "blue",
                    secondary: "green"
                }
                fontSize: true
            },
            shorthands: {
                bgColor: ["backgroundColor"],
            }
        });

        const className = atomicLocal({
            fontSize: { hover: "2rem", navItem: "12px" },
            bgColor: "primary",
            small: { fontSize: "8px", backgroundColor: "secondary" }
        });
    `
    );

    const extractDefs = extractFromCode(sourceFile, { functions: ["defineProperties"] });
    const queryList = (extractDefs.get("defineProperties") as ExtractedFunctionResult).queryList;

    const configByName = new Map<string, { query: ExtractedFunctionInstance; config: GenericConfig }>();
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

    const fnName = "atomicLocal";
    const extracted = extractFromCode(sourceFile, { functions: [fnName] });
    const styles = generateStyleFromExtraction({
        name: fnName,
        extracted: extracted.get(fnName)! as ExtractedFunctionResult,
        config: configByName.get(fnName)!.config,
    });

    const magicStr = new MagicString(sourceFile.getFullText());
    const generateStyleResults = new Set<ReturnType<typeof generateStyleFromExtraction>>();
    generateStyleResults.add(styles);

    expect(styles.classByDebugId.size).toMatchInlineSnapshot("5");
    expect(styles.classByDebugId).toMatchInlineSnapshot(`
      {
          atomicLocal_backgroundColor_primary: "atomicLocal_backgroundColor_primary__1rxundp0",
          atomicLocal_fontSize_hover_2rem: "atomicLocal_fontSize_hover_2rem__1rxundp1",
          atomicLocal_fontSize_navItem_12px: "atomicLocal_fontSize_navItem_12px__1rxundp2",
          atomicLocal_fontSize_small_8px: "atomicLocal_fontSize_small_8px__1rxundp3",
          atomicLocal_backgroundColor_small_secondary: "atomicLocal_backgroundColor_small_secondary__1rxundp4",
      }
    `);
    expect(styles.allRules.size).toMatchInlineSnapshot("5");
    expect(styles.allRules).toMatchInlineSnapshot(`
      [
          {
              name: "atomicLocal",
              type: "local",
              mode: "atomic",
              rule: {
                  backgroundColor: "blue",
              },
              debugId: "atomicLocal_backgroundColor_primary",
              propName: "backgroundColor",
              value: "blue",
              token: "primary",
          },
          {
              name: "atomicLocal",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      " &:hover": {
                          fontSize: "2rem",
                      },
                  },
              },
              debugId: "atomicLocal_fontSize_hover_2rem",
              propName: "fontSize",
              value: "2rem",
              token: "2rem",
              conditionPath: ["hover"],
          },
          {
              name: "atomicLocal",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      "nav li > &": {
                          fontSize: "12px",
                      },
                  },
              },
              debugId: "atomicLocal_fontSize_navItem_12px",
              propName: "fontSize",
              value: "12px",
              token: "12px",
              conditionPath: ["navItem"],
          },
          {
              name: "atomicLocal",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      ".small &": {
                          fontSize: "8px",
                      },
                  },
              },
              debugId: "atomicLocal_fontSize_small_8px",
              propName: "fontSize",
              value: "8px",
              token: "8px",
              conditionPath: ["small"],
          },
          {
              name: "atomicLocal",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      ".small &": {
                          backgroundColor: "green",
                      },
                  },
              },
              debugId: "atomicLocal_backgroundColor_small_secondary",
              propName: "backgroundColor",
              value: "green",
              token: "secondary",
              conditionPath: ["small"],
          },
      ]
    `);

    const { cssMap } = ctx.getCss();
    expect(cssMap.get("test/jit-style.test.ts")).toMatchInlineSnapshot(`
      ".atomicLocal_backgroundColor_primary__1rxundp0 {
        background-color: blue;
      }
       .atomicLocal_fontSize_hover_2rem__1rxundp1:hover {
        font-size: 2rem;
      }
      nav li > .atomicLocal_fontSize_navItem_12px__1rxundp2 {
        font-size: 12px;
      }
      .small .atomicLocal_fontSize_small_8px__1rxundp3 {
        font-size: 8px;
      }
      .small .atomicLocal_backgroundColor_small_secondary__1rxundp4 {
        background-color: green;
      }"
    `);

    transformStyleNodes(generateStyleResults, magicStr);

    expect(magicStr.toString()).toMatchInlineSnapshot(`
      "
              const atomicLocal = defineProperties({
                  conditions: {
                      small: { selector: ".small &" },
                      hover: { selector: "&:hover" },
                      navItem: { selector: 'nav li > &' },
                  },
                  properties: {
                      backgroundColor: {
                          primary: "blue",
                          secondary: "green"
                      }
                      fontSize: true
                  },
                  shorthands: {
                      bgColor: ["backgroundColor"],
                  }
              });

              const className = "atomicLocal_backgroundColor_primary__1rxundp0 atomicLocal_fontSize_hover_2rem__1rxundp1 atomicLocal_fontSize_navItem_12px__1rxundp2 atomicLocal_fontSize_small_8px__1rxundp3 atomicLocal_backgroundColor_small_secondary__1rxundp4";
          "
    `);

    endFileScope();
    ctx.removeAdapter();
});

it("minimal grouped local class", () => {
    const sourceFile = project.createSourceFile(
        "minimal-grouped-local.ts",
        `
        const groupedLocal = defineProperties({
            conditions: {
                small: { selector: ".small &" },
                hover: { selector: "&:hover" },
                navItem: { selector: 'nav li > &' },
            },
            properties: {
                backgroundColor: {
                    primary: "blue",
                    secondary: "green"
                }
                fontSize: true
            },
            shorthands: {
                bgColor: ["backgroundColor"],
            }
        });

        const className = groupedLocal({
            fontSize: { hover: "2rem", navItem: "12px" },
            bgColor: "primary",
            small: { fontSize: "8px", backgroundColor: "secondary" }
        }, { mode: "grouped" });
    `
    );

    const extractDefs = extractFromCode(sourceFile, { functions: ["defineProperties"] });
    const queryList = (extractDefs.get("defineProperties") as ExtractedFunctionResult).queryList;

    const configByName = new Map<string, { query: ExtractedFunctionInstance; config: GenericConfig }>();
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

    const fnName = "groupedLocal";
    const extracted = extractFromCode(sourceFile, { functions: [fnName] });
    const styles = generateStyleFromExtraction({
        name: fnName,
        extracted: extracted.get(fnName)! as ExtractedFunctionResult,
        config: configByName.get(fnName)!.config,
    });

    const magicStr = new MagicString(sourceFile.getFullText());
    const generateStyleResults = new Set<ReturnType<typeof generateStyleFromExtraction>>();
    generateStyleResults.add(styles);

    expect(styles.classByDebugId.size).toMatchInlineSnapshot("1");
    expect(styles.classByDebugId).toMatchInlineSnapshot(`
      {
          groupedLocal__backgroundColor_primary__fontSize_hover_2rem__fontSize_navItem_12px__fontSize_small_8px__backgroundColor_small_secondary:
              "groupedLocal__backgroundColor_primary__fontSize_hover_2rem__fontSize_navItem_12px__fontSize_small_8px__backgroundColor_small_secondary__1rxundp0",
      }
    `);
    expect(styles.allRules.size).toMatchInlineSnapshot("1");
    expect(styles.allRules).toMatchInlineSnapshot(`
      [
          {
              name: "groupedLocal",
              mode: "grouped",
              type: "local",
              rule: {
                  backgroundColor: "blue",
                  selectors: {
                      " &:hover": {
                          fontSize: "2rem",
                      },
                      "nav li > &": {
                          fontSize: "12px",
                      },
                      ".small &": {
                          fontSize: "8px",
                          backgroundColor: "green",
                      },
                  },
              },
              debugId:
                  "groupedLocal__backgroundColor_primary__fontSize_hover_2rem__fontSize_navItem_12px__fontSize_small_8px__backgroundColor_small_secondary",
              fromRules: [
                  {
                      name: "groupedLocal",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          backgroundColor: "blue",
                          selectors: {
                              " &:hover": {
                                  fontSize: "2rem",
                              },
                              "nav li > &": {
                                  fontSize: "12px",
                              },
                              ".small &": {
                                  fontSize: "8px",
                                  backgroundColor: "green",
                              },
                          },
                      },
                      debugId: "groupedLocal_backgroundColor_primary",
                      propName: "backgroundColor",
                      value: "blue",
                      token: "primary",
                  },
                  {
                      name: "groupedLocal",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              " &:hover": {
                                  fontSize: "2rem",
                              },
                          },
                      },
                      debugId: "groupedLocal_fontSize_hover_2rem",
                      propName: "fontSize",
                      value: "2rem",
                      token: "2rem",
                      conditionPath: ["hover"],
                  },
                  {
                      name: "groupedLocal",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              "nav li > &": {
                                  fontSize: "12px",
                              },
                          },
                      },
                      debugId: "groupedLocal_fontSize_navItem_12px",
                      propName: "fontSize",
                      value: "12px",
                      token: "12px",
                      conditionPath: ["navItem"],
                  },
                  {
                      name: "groupedLocal",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".small &": {
                                  fontSize: "8px",
                              },
                          },
                      },
                      debugId: "groupedLocal_fontSize_small_8px",
                      propName: "fontSize",
                      value: "8px",
                      token: "8px",
                      conditionPath: ["small"],
                  },
                  {
                      name: "groupedLocal",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".small &": {
                                  backgroundColor: "green",
                              },
                          },
                      },
                      debugId: "groupedLocal_backgroundColor_small_secondary",
                      propName: "backgroundColor",
                      value: "green",
                      token: "secondary",
                      conditionPath: ["small"],
                  },
              ],
          },
      ]
    `);

    const { cssMap } = ctx.getCss();
    expect(cssMap.get("test/jit-style.test.ts")).toMatchInlineSnapshot(`
      ".groupedLocal__backgroundColor_primary__fontSize_hover_2rem__fontSize_navItem_12px__fontSize_small_8px__backgroundColor_small_secondary__1rxundp0 {
        background-color: blue;
      }
       .groupedLocal__backgroundColor_primary__fontSize_hover_2rem__fontSize_navItem_12px__fontSize_small_8px__backgroundColor_small_secondary__1rxundp0:hover {
        font-size: 2rem;
      }
      nav li > .groupedLocal__backgroundColor_primary__fontSize_hover_2rem__fontSize_navItem_12px__fontSize_small_8px__backgroundColor_small_secondary__1rxundp0 {
        font-size: 12px;
      }
      .small .groupedLocal__backgroundColor_primary__fontSize_hover_2rem__fontSize_navItem_12px__fontSize_small_8px__backgroundColor_small_secondary__1rxundp0 {
        font-size: 8px;
        background-color: green;
      }"
    `);

    transformStyleNodes(generateStyleResults, magicStr);

    expect(magicStr.toString()).toMatchInlineSnapshot(`
      "
              const groupedLocal = defineProperties({
                  conditions: {
                      small: { selector: ".small &" },
                      hover: { selector: "&:hover" },
                      navItem: { selector: 'nav li > &' },
                  },
                  properties: {
                      backgroundColor: {
                          primary: "blue",
                          secondary: "green"
                      }
                      fontSize: true
                  },
                  shorthands: {
                      bgColor: ["backgroundColor"],
                  }
              });

              const className = "groupedLocal__backgroundColor_primary__fontSize_hover_2rem__fontSize_navItem_12px__fontSize_small_8px__backgroundColor_small_secondary__1rxundp0";
          "
    `);

    endFileScope();
    ctx.removeAdapter();
});

it("minimal global", () => {
    const sourceFile = project.createSourceFile(
        "minimal-global.ts",
        `
        const minimalGlobal = defineProperties({
            conditions: {
                small: { selector: ".small &" },
                hover: { selector: "&:hover" },
                navItem: { selector: 'nav li > &' },
            },
            properties: {
                backgroundColor: {
                    primary: "blue",
                    secondary: "green"
                }
                fontSize: true
            },
            shorthands: {
                bgColor: ["backgroundColor"],
            }
        });

        minimalGlobal({
            fontSize: { hover: "2rem", navItem: "12px" },
            bgColor: "primary",
            small: { fontSize: "8px", backgroundColor: "secondary" }
        }, { selector: ":root" });
    `
    );

    const extractDefs = extractFromCode(sourceFile, { functions: ["defineProperties"] });
    const queryList = (extractDefs.get("defineProperties") as ExtractedFunctionResult).queryList;

    const configByName = new Map<string, { query: ExtractedFunctionInstance; config: GenericConfig }>();
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

    const fnName = "minimalGlobal";
    const extracted = extractFromCode(sourceFile, { functions: [fnName] });
    const styles = generateStyleFromExtraction({
        name: fnName,
        extracted: extracted.get(fnName)! as ExtractedFunctionResult,
        config: configByName.get(fnName)!.config,
    });

    const magicStr = new MagicString(sourceFile.getFullText());
    const generateStyleResults = new Set<ReturnType<typeof generateStyleFromExtraction>>();
    generateStyleResults.add(styles);

    expect(styles.classByDebugId.size).toMatchInlineSnapshot("0");
    expect(styles.classByDebugId).toMatchInlineSnapshot("{}");
    expect(styles.allRules.size).toMatchInlineSnapshot("4");
    expect(styles.allRules).toMatchInlineSnapshot(`
      [
          {
              name: "minimalGlobal",
              type: "global",
              mode: "grouped",
              debugId: "minimalGlobal_0_global__backgroundColor_primary",
              rule: {
                  backgroundColor: "blue",
              },
              fromRules: [
                  {
                      name: "minimalGlobal",
                      type: "global",
                      mode: "atomic",
                      rule: {
                          backgroundColor: "blue",
                      },
                      debugId: "minimalGlobal_0_global_backgroundColor_primary",
                      propName: "backgroundColor",
                      value: "blue",
                      token: "primary",
                  },
              ],
              selector: ":root",
          },
          {
              name: "minimalGlobal",
              type: "global",
              mode: "grouped",
              rule: {
                  fontSize: "2rem",
              },
              debugId: "minimalGlobal_1_global__fontSize_hover_2rem",
              selector: ":root  &:hover",
              fromRules: [
                  {
                      name: "minimalGlobal",
                      type: "global",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              " &:hover": {
                                  fontSize: "2rem",
                              },
                          },
                      },
                      debugId: "minimalGlobal_0_global_fontSize_hover_2rem",
                      propName: "fontSize",
                      value: "2rem",
                      token: "2rem",
                      conditionPath: ["hover"],
                  },
              ],
          },
          {
              name: "minimalGlobal",
              type: "global",
              mode: "grouped",
              rule: {
                  fontSize: "12px",
              },
              debugId: "minimalGlobal_2_global__fontSize_navItem_12px",
              selector: ":root nav li > *",
              fromRules: [
                  {
                      name: "minimalGlobal",
                      type: "global",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              "nav li > &": {
                                  fontSize: "12px",
                              },
                          },
                      },
                      debugId: "minimalGlobal_0_global_fontSize_navItem_12px",
                      propName: "fontSize",
                      value: "12px",
                      token: "12px",
                      conditionPath: ["navItem"],
                  },
              ],
          },
          {
              name: "minimalGlobal",
              type: "global",
              mode: "grouped",
              rule: {
                  fontSize: "8px",
                  backgroundColor: "green",
              },
              debugId: "minimalGlobal_3_global__fontSize_small_8px__backgroundColor_small_secondary",
              selector: ":root.small",
              fromRules: [
                  {
                      name: "minimalGlobal",
                      type: "global",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".small &": {
                                  fontSize: "8px",
                              },
                          },
                      },
                      debugId: "minimalGlobal_0_global_fontSize_small_8px",
                      propName: "fontSize",
                      value: "8px",
                      token: "8px",
                      conditionPath: ["small"],
                  },
                  {
                      name: "minimalGlobal",
                      type: "global",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".small &": {
                                  backgroundColor: "green",
                              },
                          },
                      },
                      debugId: "minimalGlobal_0_global_backgroundColor_small_secondary",
                      propName: "backgroundColor",
                      value: "green",
                      token: "secondary",
                      conditionPath: ["small"],
                  },
              ],
          },
      ]
    `);

    const { cssMap } = ctx.getCss();
    expect(cssMap.get("test/jit-style.test.ts")).toMatchInlineSnapshot(`
      ":root {
        background-color: blue;
      }
      :root  &:hover {
        font-size: 2rem;
      }
      :root nav li > * {
        font-size: 12px;
      }
      :root.small {
        font-size: 8px;
        background-color: green;
      }"
    `);

    transformStyleNodes(generateStyleResults, magicStr);

    expect(magicStr.toString()).toMatchInlineSnapshot(`
      "
              const minimalGlobal = defineProperties({
                  conditions: {
                      small: { selector: ".small &" },
                      hover: { selector: "&:hover" },
                      navItem: { selector: 'nav li > &' },
                  },
                  properties: {
                      backgroundColor: {
                          primary: "blue",
                          secondary: "green"
                      }
                      fontSize: true
                  },
                  shorthands: {
                      bgColor: ["backgroundColor"],
                  }
              });;
          "
    `);

    endFileScope();
    ctx.removeAdapter();
});

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
    const queryList = (extractDefs.get("defineProperties") as ExtractedFunctionResult).queryList;
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
                              properties: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "map",
                                  node: "ObjectLiteralExpression",
                                  value: {
                                      color: {
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
                                              brand: {
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
                                          },
                                      },
                                  },
                              },
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
                              properties: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "map",
                                  node: "ObjectLiteralExpression",
                                  value: {
                                      borderRadius: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "PropertyAccessExpression",
                                              "Identifier",
                                              "Identifier",
                                              "VariableDeclaration",
                                              "PropertyAssignment",
                                          ],
                                          type: "map",
                                          node: "ObjectLiteralExpression",
                                          value: {
                                              none: {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                      "Identifier",
                                                      "VariableDeclaration",
                                                      "PropertyAssignment",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "0",
                                                  kind: "string",
                                              },
                                              sm: {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                      "Identifier",
                                                      "VariableDeclaration",
                                                      "PropertyAssignment",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "0.125rem",
                                                  kind: "string",
                                              },
                                              base: {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                      "Identifier",
                                                      "VariableDeclaration",
                                                      "PropertyAssignment",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "0.25rem",
                                                  kind: "string",
                                              },
                                              md: {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                      "Identifier",
                                                      "VariableDeclaration",
                                                      "PropertyAssignment",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "0.375rem",
                                                  kind: "string",
                                              },
                                              lg: {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                      "Identifier",
                                                      "VariableDeclaration",
                                                      "PropertyAssignment",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "0.5rem",
                                                  kind: "string",
                                              },
                                              xl: {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                      "Identifier",
                                                      "VariableDeclaration",
                                                      "PropertyAssignment",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "0.75rem",
                                                  kind: "string",
                                              },
                                              "2xl": {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                      "Identifier",
                                                      "VariableDeclaration",
                                                      "PropertyAssignment",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "1rem",
                                                  kind: "string",
                                              },
                                              "3xl": {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                      "Identifier",
                                                      "VariableDeclaration",
                                                      "PropertyAssignment",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "1.5rem",
                                                  kind: "string",
                                              },
                                              full: {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                      "Identifier",
                                                      "VariableDeclaration",
                                                      "PropertyAssignment",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "9999px",
                                                  kind: "string",
                                              },
                                          },
                                      },
                                      padding: {
                                          stack: [
                                              "CallExpression",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "ObjectLiteralExpression",
                                              "PropertyAssignment",
                                              "PropertyAccessExpression",
                                              "Identifier",
                                              "Identifier",
                                              "VariableDeclaration",
                                              "PropertyAssignment",
                                          ],
                                          type: "map",
                                          node: "ObjectLiteralExpression",
                                          value: {
                                              "4": {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                      "Identifier",
                                                      "VariableDeclaration",
                                                      "PropertyAssignment",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "4px",
                                                  kind: "string",
                                              },
                                              "8": {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                      "Identifier",
                                                      "VariableDeclaration",
                                                      "PropertyAssignment",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "8px",
                                                  kind: "string",
                                              },
                                              "12": {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                      "Identifier",
                                                      "VariableDeclaration",
                                                      "PropertyAssignment",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "12px",
                                                  kind: "string",
                                              },
                                              "16": {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                      "Identifier",
                                                      "VariableDeclaration",
                                                      "PropertyAssignment",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "16px",
                                                  kind: "string",
                                              },
                                              "20": {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                      "Identifier",
                                                      "VariableDeclaration",
                                                      "PropertyAssignment",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "20px",
                                                  kind: "string",
                                              },
                                              "24": {
                                                  stack: [
                                                      "CallExpression",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "ObjectLiteralExpression",
                                                      "PropertyAssignment",
                                                      "PropertyAccessExpression",
                                                      "Identifier",
                                                      "Identifier",
                                                      "VariableDeclaration",
                                                      "PropertyAssignment",
                                                      "PropertyAssignment",
                                                      "StringLiteral",
                                                  ],
                                                  type: "literal",
                                                  node: "StringLiteral",
                                                  value: "24px",
                                                  kind: "string",
                                              },
                                          },
                                      },
                                  },
                              },
                              shorthands: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "ObjectLiteralExpression",
                                  ],
                                  type: "map",
                                  node: "ObjectLiteralExpression",
                                  value: {
                                      p: {
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
                                      rounded: {
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
                                  },
                              },
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

    const configByName = new Map<string, { query: ExtractedFunctionInstance; config: GenericConfig }>();
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

    const minimalSprinkles = extracted.get("minimalSprinkles")! as ExtractedFunctionResult;
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
                              color: {
                                  stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "brand",
                                  kind: "string",
                              },
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
                              color: {
                                  stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "red.100",
                                  kind: "string",
                              },
                              display: {
                                  stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "flex",
                                  kind: "string",
                              },
                          },
                      },
                  ],
              },
          },
      ]
    `);

    const minimalStyles = generateStyleFromExtraction({
        name: "minimalSprinkles",
        extracted: minimalSprinkles,
        config: configByName.get("minimalSprinkles")!.config,
    });
    expect(minimalStyles.classByDebugId).toMatchInlineSnapshot(`
      {
          minimalSprinkles_color_brand: "minimalSprinkles_color_brand__1rxundp0",
          "minimalSprinkles_color_red.100": "minimalSprinkles_color_red.100__1rxundp1",
      }
    `);
    expect(minimalStyles.allRules).toMatchInlineSnapshot(`
      [
          {
              name: "minimalSprinkles",
              type: "local",
              mode: "atomic",
              rule: {
                  color: "var(--brand)",
              },
              debugId: "minimalSprinkles_color_brand",
              propName: "color",
              value: "var(--brand)",
              token: "brand",
          },
          {
              name: "minimalSprinkles",
              type: "local",
              mode: "atomic",
              rule: {
                  color: "red.100",
              },
              debugId: "minimalSprinkles_color_red.100",
              propName: "color",
              value: "red.100",
              token: "red.100",
          },
      ]
    `);

    const magicStr = new MagicString(sourceFile.getFullText());
    const generateStyleResults = new Set<ReturnType<typeof generateStyleFromExtraction>>();
    generateStyleResults.add(minimalStyles);

    const tw = extracted.get("tw")! as ExtractedFunctionResult;
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
                              p: {
                                  stack: [
                                      "CallExpression",
                                      "ObjectLiteralExpression",
                                      "PropertyAssignment",
                                      "NumericLiteral",
                                  ],
                                  type: "literal",
                                  node: "NumericLiteral",
                                  value: 24,
                                  kind: "number",
                              },
                              rounded: {
                                  stack: ["CallExpression", "ObjectLiteralExpression", "PropertyAssignment", "StringLiteral"],
                                  type: "literal",
                                  node: "StringLiteral",
                                  value: "lg",
                                  kind: "string",
                              },
                          },
                      },
                  ],
              },
          },
      ]
    `);

    const twStyles = generateStyleFromExtraction({
        name: "tw",
        extracted: tw,
        config: configByName.get("tw")!.config,
    });
    expect(twStyles.classByDebugId).toMatchInlineSnapshot(`
      {
          tw_padding_24: "tw_padding_24__1rxundp2",
          tw_borderRadius_lg: "tw_borderRadius_lg__1rxundp3",
      }
    `);
    expect(twStyles.allRules).toMatchInlineSnapshot(`
      [
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  padding: "24px",
              },
              debugId: "tw_padding_24",
              propName: "padding",
              value: "24px",
              token: 24,
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  borderRadius: "0.5rem",
              },
              debugId: "tw_borderRadius_lg",
              propName: "borderRadius",
              value: "0.5rem",
              token: "lg",
          },
      ]
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
    const queryList = (extractDefs.get("defineProperties") as ExtractedFunctionResult).queryList;

    const configByName = new Map<string, { query: ExtractedFunctionInstance; config: GenericConfig }>();
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
    const tw = extracted.get("tw")! as ExtractedFunctionResult;
    const twStyles = generateStyleFromExtraction({
        name: "tw",
        extracted: tw,
        config: configByName.get("tw")!.config,
    });

    const magicStr = new MagicString(sourceFile.getFullText());
    const generateStyleResults = new Set<ReturnType<typeof generateStyleFromExtraction>>();

    expect(twStyles.classByDebugId.size).toMatchInlineSnapshot('21');
    expect(twStyles.classByDebugId).toMatchInlineSnapshot(`
      {
          "tw_backgroundColor_blue.500": "tw_backgroundColor_blue.500__1rxundp0",
          tw_padding_24: "tw_padding_24__1rxundp1",
          tw_borderRadius_lg: "tw_borderRadius_lg__1rxundp2",
          "tw_display_dark_hover_table-footer-group": "tw_display_dark_hover_table-footer-group__1rxundp3",
          "tw_color_navItem_hoverNotActive_brand.100": "tw_color_navItem_hoverNotActive_brand.100__1rxundp4",
          tw_backgroundColor_hover_whitesmoke: "tw_backgroundColor_hover_whitesmoke__1rxundp5",
          tw_borderRadius_hover_2xl: "tw_borderRadius_hover_2xl__1rxundp6",
          tw_color_hover_darkseagreen: "tw_color_hover_darkseagreen__1rxundp7",
          tw_padding_hover_100px: "tw_padding_hover_100px__1rxundp8",
          tw_padding_hover_4: "tw_padding_hover_4__1rxundp9",
          tw_display_hover_dark_large_flex: "tw_display_hover_dark_large_flex__1rxundpa",
          "tw_display_hover_light_inline-flex": "tw_display_hover_light_inline-flex__1rxundpb",
          "tw_backgroundColor_hover_dark_blue.700": "tw_backgroundColor_hover_dark_blue.700__1rxundpc",
          "tw_backgroundColor_hover_light_large_red.200": "tw_backgroundColor_hover_light_large_red.200__1rxundpd",
          tw_backgroundColor_hover_light_dark_ThreeDHighlight:
              "tw_backgroundColor_hover_light_dark_ThreeDHighlight__1rxundpe",
          tw_padding_dark_24: "tw_padding_dark_24__1rxundpf",
          "tw_backgroundColor_dark_red.800": "tw_backgroundColor_dark_red.800__1rxundpg",
          tw_backgroundColor_dark_whitesmoke: "tw_backgroundColor_dark_whitesmoke__1rxundph",
          "tw_color_dark_hover_blue.600": "tw_color_dark_hover_blue.600__1rxundpi",
          tw_display_dark_hover_light_flex: "tw_display_dark_hover_light_flex__1rxundpj",
          tw_display_dark_hover_large_small_contents: "tw_display_dark_hover_large_small_contents__1rxundpk",
      }
    `);
    expect(twStyles.allRules).toMatchInlineSnapshot(`
      [
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  backgroundColor: "#3182ce",
              },
              debugId: "tw_backgroundColor_blue.500",
              propName: "backgroundColor",
              value: "#3182ce",
              token: "blue.500",
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  padding: "24px",
              },
              debugId: "tw_padding_24",
              propName: "padding",
              value: "24px",
              token: 24,
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  borderRadius: "0.5rem",
              },
              debugId: "tw_borderRadius_lg",
              propName: "borderRadius",
              value: "0.5rem",
              token: "lg",
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      ".dark &:hover": {
                          display: "table-footer-group",
                      },
                  },
              },
              debugId: "tw_display_dark_hover_table-footer-group",
              propName: "display",
              value: "table-footer-group",
              token: "table-footer-group",
              conditionPath: ["dark", "hover"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      "nav li > &:hover:not(:active)": {
                          color: "#EFF6F8",
                      },
                  },
              },
              debugId: "tw_color_navItem_hoverNotActive_brand.100",
              propName: "color",
              value: "#EFF6F8",
              token: "brand.100",
              conditionPath: ["navItem", "hoverNotActive"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      " &:hover": {
                          backgroundColor: "whitesmoke",
                      },
                  },
              },
              debugId: "tw_backgroundColor_hover_whitesmoke",
              propName: "backgroundColor",
              value: "whitesmoke",
              token: "whitesmoke",
              conditionPath: ["hover"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      " &:hover": {
                          borderRadius: "1rem",
                      },
                  },
              },
              debugId: "tw_borderRadius_hover_2xl",
              propName: "borderRadius",
              value: "1rem",
              token: "2xl",
              conditionPath: ["hover"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      " &:hover": {
                          color: "darkseagreen",
                      },
                  },
              },
              debugId: "tw_color_hover_darkseagreen",
              propName: "color",
              value: "darkseagreen",
              token: "darkseagreen",
              conditionPath: ["hover"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      " &:hover": {
                          padding: "100px",
                      },
                  },
              },
              debugId: "tw_padding_hover_100px",
              propName: "padding",
              value: "100px",
              token: "100px",
              conditionPath: ["hover"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      " &:hover": {
                          padding: "4px",
                      },
                  },
              },
              debugId: "tw_padding_hover_4",
              propName: "padding",
              value: "4px",
              token: "4",
              conditionPath: ["hover"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      ".dark.large &:hover": {
                          display: "flex",
                      },
                  },
              },
              debugId: "tw_display_hover_dark_large_flex",
              propName: "display",
              value: "flex",
              token: "flex",
              conditionPath: ["hover", "dark", "large"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      ".light &:hover": {
                          display: "inline-flex",
                      },
                  },
              },
              debugId: "tw_display_hover_light_inline-flex",
              propName: "display",
              value: "inline-flex",
              token: "inline-flex",
              conditionPath: ["hover", "light"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      ".dark &:hover": {
                          backgroundColor: "#2c5282",
                      },
                  },
              },
              debugId: "tw_backgroundColor_hover_dark_blue.700",
              propName: "backgroundColor",
              value: "#2c5282",
              token: "blue.700",
              conditionPath: ["hover", "dark"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      ".light.large &:hover": {
                          backgroundColor: "#FEB2B2",
                      },
                  },
              },
              debugId: "tw_backgroundColor_hover_light_large_red.200",
              propName: "backgroundColor",
              value: "#FEB2B2",
              token: "red.200",
              conditionPath: ["hover", "light", "large"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      ".light.dark &:hover": {
                          backgroundColor: "ThreeDHighlight",
                      },
                  },
              },
              debugId: "tw_backgroundColor_hover_light_dark_ThreeDHighlight",
              propName: "backgroundColor",
              value: "ThreeDHighlight",
              token: "ThreeDHighlight",
              conditionPath: ["hover", "light", "dark"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      ".dark &": {
                          padding: "24px",
                      },
                  },
              },
              debugId: "tw_padding_dark_24",
              propName: "padding",
              value: "24px",
              token: 24,
              conditionPath: ["dark"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      ".dark &": {
                          backgroundColor: "#822727",
                      },
                  },
              },
              debugId: "tw_backgroundColor_dark_red.800",
              propName: "backgroundColor",
              value: "#822727",
              token: "red.800",
              conditionPath: ["dark"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      ".dark &": {
                          backgroundColor: "whitesmoke",
                      },
                  },
              },
              debugId: "tw_backgroundColor_dark_whitesmoke",
              propName: "backgroundColor",
              value: "whitesmoke",
              token: "whitesmoke",
              conditionPath: ["dark"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      ".dark &:hover": {
                          color: "#2b6cb0",
                      },
                  },
              },
              debugId: "tw_color_dark_hover_blue.600",
              propName: "color",
              value: "#2b6cb0",
              token: "blue.600",
              conditionPath: ["dark", "hover"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      ".dark.light &:hover": {
                          display: "flex",
                      },
                  },
              },
              debugId: "tw_display_dark_hover_light_flex",
              propName: "display",
              value: "flex",
              token: "flex",
              conditionPath: ["dark", "hover", "light"],
          },
          {
              name: "tw",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      ".dark.large.small &:hover": {
                          display: "contents",
                      },
                  },
              },
              debugId: "tw_display_dark_hover_large_small_contents",
              propName: "display",
              value: "contents",
              token: "contents",
              conditionPath: ["dark", "hover", "large", "small"],
          },
      ]
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

      const className = "tw_backgroundColor_blue.500__1rxundp0 tw_padding_24__1rxundp1 tw_borderRadius_lg__1rxundp2 tw_display_dark_hover_table-footer-group__1rxundp3 tw_color_navItem_hoverNotActive_brand.100__1rxundp4 tw_backgroundColor_hover_whitesmoke__1rxundp5 tw_borderRadius_hover_2xl__1rxundp6 tw_color_hover_darkseagreen__1rxundp7 tw_padding_hover_100px__1rxundp8 tw_padding_hover_4__1rxundp9 tw_display_hover_dark_large_flex__1rxundpa tw_display_hover_light_inline-flex__1rxundpb tw_backgroundColor_hover_dark_blue.700__1rxundpc tw_backgroundColor_hover_light_large_red.200__1rxundpd tw_backgroundColor_hover_light_dark_ThreeDHighlight__1rxundpe tw_padding_dark_24__1rxundpf tw_backgroundColor_dark_red.800__1rxundpg tw_backgroundColor_dark_whitesmoke__1rxundph tw_color_dark_hover_blue.600__1rxundpi tw_display_dark_hover_light_flex__1rxundpj tw_display_dark_hover_large_small_contents__1rxundpk";"
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
       .tw_padding_hover_100px__1rxundp8:hover {
        padding: 100px;
      }
       .tw_padding_hover_4__1rxundp9:hover {
        padding: 4px;
      }
      .dark.large .tw_display_hover_dark_large_flex__1rxundpa:hover {
        display: flex;
      }
      .light .tw_display_hover_light_inline-flex__1rxundpb:hover {
        display: inline-flex;
      }
      .dark .tw_backgroundColor_hover_dark_blue\\.700__1rxundpc:hover {
        background-color: #2c5282;
      }
      .light.large .tw_backgroundColor_hover_light_large_red\\.200__1rxundpd:hover {
        background-color: #FEB2B2;
      }
      .light.dark .tw_backgroundColor_hover_light_dark_ThreeDHighlight__1rxundpe:hover {
        background-color: ThreeDHighlight;
      }
      .dark .tw_padding_dark_24__1rxundpf {
        padding: 24px;
      }
      .dark .tw_backgroundColor_dark_red\\.800__1rxundpg {
        background-color: #822727;
      }
      .dark .tw_backgroundColor_dark_whitesmoke__1rxundph {
        background-color: whitesmoke;
      }
      .dark .tw_color_dark_hover_blue\\.600__1rxundpi:hover {
        color: #2b6cb0;
      }
      .dark.light .tw_display_dark_hover_light_flex__1rxundpj:hover {
        display: flex;
      }
      .dark.large.small .tw_display_dark_hover_large_small_contents__1rxundpk:hover {
        display: contents;
      }"
    `);

    endFileScope();
    ctx.removeAdapter();
});

it("will generate multiple styles with nested conditions - grouped", () => {
    const sourceFile = project.createSourceFile("multiple.grouped.css.ts", codeSample);

    const extractDefs = extractFromCode(sourceFile, { functions: ["defineProperties"] });
    const queryList = (extractDefs.get("defineProperties") as ExtractedFunctionResult).queryList;

    const configByName = new Map<string, { query: ExtractedFunctionInstance; config: GenericConfig }>();
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
    const tw = extracted.get("tw")! as ExtractedFunctionResult;
    const twStyles = generateStyleFromExtraction({
        name: "tw",
        extracted: tw,
        config: configByName.get("tw")!.config,
        mode: "grouped",
    });

    const magicStr = new MagicString(sourceFile.getFullText());
    const generateStyleResults = new Set<ReturnType<typeof generateStyleFromExtraction>>();

    expect(twStyles.classByDebugId.size).toMatchInlineSnapshot("1");
    expect(twStyles.classByDebugId).toMatchInlineSnapshot(`
      {
          "tw__backgroundColor_blue.500__padding_24__borderRadius_lg__display_dark_hover_table-footer-group__color_navItem_hoverNotActive_brand.100__backgroundColor_hover_whitesmoke__borderRadius_hover_2xl__color_hover_darkseagreen__padding_hover_100px__padding_hover_4__display_hover_dark_large_flex__display_hover_light_inline-flex__backgroundColor_hover_dark_blue.700__backgroundColor_hover_light_large_red.200__backgroundColor_hover_light_dark_ThreeDHighlight__padding_dark_24__backgroundColor_dark_red.800__backgroundColor_dark_whitesmoke__color_dark_hover_blue.600__display_dark_hover_light_flex__display_dark_hover_large_small_contents":
              "tw__backgroundColor_blue.500__padding_24__borderRadius_lg__display_dark_hover_table-footer-group__color_navItem_hoverNotActive_brand.100__backgroundColor_hover_whitesmoke__borderRadius_hover_2xl__color_hover_darkseagreen__padding_hover_100px__padding_hover_4__display_hover_dark_large_flex__display_hover_light_inline-flex__backgroundColor_hover_dark_blue.700__backgroundColor_hover_light_large_red.200__backgroundColor_hover_light_dark_ThreeDHighlight__padding_dark_24__backgroundColor_dark_red.800__backgroundColor_dark_whitesmoke__color_dark_hover_blue.600__display_dark_hover_light_flex__display_dark_hover_large_small_contents__1rxundp0",
      }
    `);
    expect(twStyles.allRules).toMatchInlineSnapshot(`
      [
          {
              name: "tw",
              mode: "grouped",
              type: "local",
              rule: {
                  backgroundColor: "#3182ce",
                  padding: "24px",
                  borderRadius: "0.5rem",
                  selectors: {
                      ".dark &:hover": {
                          display: "table-footer-group",
                          backgroundColor: "#2c5282",
                          color: "#2b6cb0",
                      },
                      "nav li > &:hover:not(:active)": {
                          color: "#EFF6F8",
                      },
                      " &:hover": {
                          backgroundColor: "whitesmoke",
                          borderRadius: "1rem",
                          color: "darkseagreen",
                          padding: "4px",
                      },
                      ".dark.large &:hover": {
                          display: "flex",
                      },
                      ".light &:hover": {
                          display: "inline-flex",
                      },
                      ".light.large &:hover": {
                          backgroundColor: "#FEB2B2",
                      },
                      ".light.dark &:hover": {
                          backgroundColor: "ThreeDHighlight",
                      },
                      ".dark &": {
                          padding: "24px",
                          backgroundColor: "whitesmoke",
                      },
                      ".dark.light &:hover": {
                          display: "flex",
                      },
                      ".dark.large.small &:hover": {
                          display: "contents",
                      },
                  },
              },
              debugId:
                  "tw__backgroundColor_blue.500__padding_24__borderRadius_lg__display_dark_hover_table-footer-group__color_navItem_hoverNotActive_brand.100__backgroundColor_hover_whitesmoke__borderRadius_hover_2xl__color_hover_darkseagreen__padding_hover_100px__padding_hover_4__display_hover_dark_large_flex__display_hover_light_inline-flex__backgroundColor_hover_dark_blue.700__backgroundColor_hover_light_large_red.200__backgroundColor_hover_light_dark_ThreeDHighlight__padding_dark_24__backgroundColor_dark_red.800__backgroundColor_dark_whitesmoke__color_dark_hover_blue.600__display_dark_hover_light_flex__display_dark_hover_large_small_contents",
              fromRules: [
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          backgroundColor: "#3182ce",
                          padding: "24px",
                          borderRadius: "0.5rem",
                          selectors: {
                              ".dark &:hover": {
                                  display: "table-footer-group",
                                  backgroundColor: "#2c5282",
                                  color: "#2b6cb0",
                              },
                              "nav li > &:hover:not(:active)": {
                                  color: "#EFF6F8",
                              },
                              " &:hover": {
                                  backgroundColor: "whitesmoke",
                                  borderRadius: "1rem",
                                  color: "darkseagreen",
                                  padding: "4px",
                              },
                              ".dark.large &:hover": {
                                  display: "flex",
                              },
                              ".light &:hover": {
                                  display: "inline-flex",
                              },
                              ".light.large &:hover": {
                                  backgroundColor: "#FEB2B2",
                              },
                              ".light.dark &:hover": {
                                  backgroundColor: "ThreeDHighlight",
                              },
                              ".dark &": {
                                  padding: "24px",
                                  backgroundColor: "whitesmoke",
                              },
                              ".dark.light &:hover": {
                                  display: "flex",
                              },
                              ".dark.large.small &:hover": {
                                  display: "contents",
                              },
                          },
                      },
                      debugId: "tw_backgroundColor_blue.500",
                      propName: "backgroundColor",
                      value: "#3182ce",
                      token: "blue.500",
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          padding: "24px",
                      },
                      debugId: "tw_padding_24",
                      propName: "padding",
                      value: "24px",
                      token: 24,
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          borderRadius: "0.5rem",
                      },
                      debugId: "tw_borderRadius_lg",
                      propName: "borderRadius",
                      value: "0.5rem",
                      token: "lg",
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".dark &:hover": {
                                  display: "table-footer-group",
                              },
                          },
                      },
                      debugId: "tw_display_dark_hover_table-footer-group",
                      propName: "display",
                      value: "table-footer-group",
                      token: "table-footer-group",
                      conditionPath: ["dark", "hover"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              "nav li > &:hover:not(:active)": {
                                  color: "#EFF6F8",
                              },
                          },
                      },
                      debugId: "tw_color_navItem_hoverNotActive_brand.100",
                      propName: "color",
                      value: "#EFF6F8",
                      token: "brand.100",
                      conditionPath: ["navItem", "hoverNotActive"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              " &:hover": {
                                  backgroundColor: "whitesmoke",
                              },
                          },
                      },
                      debugId: "tw_backgroundColor_hover_whitesmoke",
                      propName: "backgroundColor",
                      value: "whitesmoke",
                      token: "whitesmoke",
                      conditionPath: ["hover"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              " &:hover": {
                                  borderRadius: "1rem",
                              },
                          },
                      },
                      debugId: "tw_borderRadius_hover_2xl",
                      propName: "borderRadius",
                      value: "1rem",
                      token: "2xl",
                      conditionPath: ["hover"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              " &:hover": {
                                  color: "darkseagreen",
                              },
                          },
                      },
                      debugId: "tw_color_hover_darkseagreen",
                      propName: "color",
                      value: "darkseagreen",
                      token: "darkseagreen",
                      conditionPath: ["hover"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              " &:hover": {
                                  padding: "100px",
                              },
                          },
                      },
                      debugId: "tw_padding_hover_100px",
                      propName: "padding",
                      value: "100px",
                      token: "100px",
                      conditionPath: ["hover"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              " &:hover": {
                                  padding: "4px",
                              },
                          },
                      },
                      debugId: "tw_padding_hover_4",
                      propName: "padding",
                      value: "4px",
                      token: "4",
                      conditionPath: ["hover"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".dark.large &:hover": {
                                  display: "flex",
                              },
                          },
                      },
                      debugId: "tw_display_hover_dark_large_flex",
                      propName: "display",
                      value: "flex",
                      token: "flex",
                      conditionPath: ["hover", "dark", "large"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".light &:hover": {
                                  display: "inline-flex",
                              },
                          },
                      },
                      debugId: "tw_display_hover_light_inline-flex",
                      propName: "display",
                      value: "inline-flex",
                      token: "inline-flex",
                      conditionPath: ["hover", "light"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".dark &:hover": {
                                  backgroundColor: "#2c5282",
                              },
                          },
                      },
                      debugId: "tw_backgroundColor_hover_dark_blue.700",
                      propName: "backgroundColor",
                      value: "#2c5282",
                      token: "blue.700",
                      conditionPath: ["hover", "dark"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".light.large &:hover": {
                                  backgroundColor: "#FEB2B2",
                              },
                          },
                      },
                      debugId: "tw_backgroundColor_hover_light_large_red.200",
                      propName: "backgroundColor",
                      value: "#FEB2B2",
                      token: "red.200",
                      conditionPath: ["hover", "light", "large"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".light.dark &:hover": {
                                  backgroundColor: "ThreeDHighlight",
                              },
                          },
                      },
                      debugId: "tw_backgroundColor_hover_light_dark_ThreeDHighlight",
                      propName: "backgroundColor",
                      value: "ThreeDHighlight",
                      token: "ThreeDHighlight",
                      conditionPath: ["hover", "light", "dark"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".dark &": {
                                  padding: "24px",
                              },
                          },
                      },
                      debugId: "tw_padding_dark_24",
                      propName: "padding",
                      value: "24px",
                      token: 24,
                      conditionPath: ["dark"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".dark &": {
                                  backgroundColor: "#822727",
                              },
                          },
                      },
                      debugId: "tw_backgroundColor_dark_red.800",
                      propName: "backgroundColor",
                      value: "#822727",
                      token: "red.800",
                      conditionPath: ["dark"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".dark &": {
                                  backgroundColor: "whitesmoke",
                              },
                          },
                      },
                      debugId: "tw_backgroundColor_dark_whitesmoke",
                      propName: "backgroundColor",
                      value: "whitesmoke",
                      token: "whitesmoke",
                      conditionPath: ["dark"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".dark &:hover": {
                                  color: "#2b6cb0",
                              },
                          },
                      },
                      debugId: "tw_color_dark_hover_blue.600",
                      propName: "color",
                      value: "#2b6cb0",
                      token: "blue.600",
                      conditionPath: ["dark", "hover"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".dark.light &:hover": {
                                  display: "flex",
                              },
                          },
                      },
                      debugId: "tw_display_dark_hover_light_flex",
                      propName: "display",
                      value: "flex",
                      token: "flex",
                      conditionPath: ["dark", "hover", "light"],
                  },
                  {
                      name: "tw",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".dark.large.small &:hover": {
                                  display: "contents",
                              },
                          },
                      },
                      debugId: "tw_display_dark_hover_large_small_contents",
                      propName: "display",
                      value: "contents",
                      token: "contents",
                      conditionPath: ["dark", "hover", "large", "small"],
                  },
              ],
          },
      ]
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

      const className = "tw__backgroundColor_blue.500__padding_24__borderRadius_lg__display_dark_hover_table-footer-group__color_navItem_hoverNotActive_brand.100__backgroundColor_hover_whitesmoke__borderRadius_hover_2xl__color_hover_darkseagreen__padding_hover_100px__padding_hover_4__display_hover_dark_large_flex__display_hover_light_inline-flex__backgroundColor_hover_dark_blue.700__backgroundColor_hover_light_large_red.200__backgroundColor_hover_light_dark_ThreeDHighlight__padding_dark_24__backgroundColor_dark_red.800__backgroundColor_dark_whitesmoke__color_dark_hover_blue.600__display_dark_hover_light_flex__display_dark_hover_large_small_contents__1rxundp0";"
    `);

    expect(ctx.getCss().cssMap.get("test/jit-style.test.ts")).toMatchInlineSnapshot(`
      ".tw__backgroundColor_blue\\.500__padding_24__borderRadius_lg__display_dark_hover_table-footer-group__color_navItem_hoverNotActive_brand\\.100__backgroundColor_hover_whitesmoke__borderRadius_hover_2xl__color_hover_darkseagreen__padding_hover_100px__padding_hover_4__display_hover_dark_large_flex__display_hover_light_inline-flex__backgroundColor_hover_dark_blue\\.700__backgroundColor_hover_light_large_red\\.200__backgroundColor_hover_light_dark_ThreeDHighlight__padding_dark_24__backgroundColor_dark_red\\.800__backgroundColor_dark_whitesmoke__color_dark_hover_blue\\.600__display_dark_hover_light_flex__display_dark_hover_large_small_contents__1rxundp0 {
        background-color: #3182ce;
        padding: 24px;
        border-radius: 0.5rem;
      }
      .dark .tw__backgroundColor_blue\\.500__padding_24__borderRadius_lg__display_dark_hover_table-footer-group__color_navItem_hoverNotActive_brand\\.100__backgroundColor_hover_whitesmoke__borderRadius_hover_2xl__color_hover_darkseagreen__padding_hover_100px__padding_hover_4__display_hover_dark_large_flex__display_hover_light_inline-flex__backgroundColor_hover_dark_blue\\.700__backgroundColor_hover_light_large_red\\.200__backgroundColor_hover_light_dark_ThreeDHighlight__padding_dark_24__backgroundColor_dark_red\\.800__backgroundColor_dark_whitesmoke__color_dark_hover_blue\\.600__display_dark_hover_light_flex__display_dark_hover_large_small_contents__1rxundp0:hover {
        display: table-footer-group;
        background-color: #2c5282;
        color: #2b6cb0;
      }
      nav li > .tw__backgroundColor_blue\\.500__padding_24__borderRadius_lg__display_dark_hover_table-footer-group__color_navItem_hoverNotActive_brand\\.100__backgroundColor_hover_whitesmoke__borderRadius_hover_2xl__color_hover_darkseagreen__padding_hover_100px__padding_hover_4__display_hover_dark_large_flex__display_hover_light_inline-flex__backgroundColor_hover_dark_blue\\.700__backgroundColor_hover_light_large_red\\.200__backgroundColor_hover_light_dark_ThreeDHighlight__padding_dark_24__backgroundColor_dark_red\\.800__backgroundColor_dark_whitesmoke__color_dark_hover_blue\\.600__display_dark_hover_light_flex__display_dark_hover_large_small_contents__1rxundp0:hover:not(:active) {
        color: #EFF6F8;
      }
       .tw__backgroundColor_blue\\.500__padding_24__borderRadius_lg__display_dark_hover_table-footer-group__color_navItem_hoverNotActive_brand\\.100__backgroundColor_hover_whitesmoke__borderRadius_hover_2xl__color_hover_darkseagreen__padding_hover_100px__padding_hover_4__display_hover_dark_large_flex__display_hover_light_inline-flex__backgroundColor_hover_dark_blue\\.700__backgroundColor_hover_light_large_red\\.200__backgroundColor_hover_light_dark_ThreeDHighlight__padding_dark_24__backgroundColor_dark_red\\.800__backgroundColor_dark_whitesmoke__color_dark_hover_blue\\.600__display_dark_hover_light_flex__display_dark_hover_large_small_contents__1rxundp0:hover {
        background-color: whitesmoke;
        border-radius: 1rem;
        color: darkseagreen;
        padding: 4px;
      }
      .dark.large .tw__backgroundColor_blue\\.500__padding_24__borderRadius_lg__display_dark_hover_table-footer-group__color_navItem_hoverNotActive_brand\\.100__backgroundColor_hover_whitesmoke__borderRadius_hover_2xl__color_hover_darkseagreen__padding_hover_100px__padding_hover_4__display_hover_dark_large_flex__display_hover_light_inline-flex__backgroundColor_hover_dark_blue\\.700__backgroundColor_hover_light_large_red\\.200__backgroundColor_hover_light_dark_ThreeDHighlight__padding_dark_24__backgroundColor_dark_red\\.800__backgroundColor_dark_whitesmoke__color_dark_hover_blue\\.600__display_dark_hover_light_flex__display_dark_hover_large_small_contents__1rxundp0:hover {
        display: flex;
      }
      .light .tw__backgroundColor_blue\\.500__padding_24__borderRadius_lg__display_dark_hover_table-footer-group__color_navItem_hoverNotActive_brand\\.100__backgroundColor_hover_whitesmoke__borderRadius_hover_2xl__color_hover_darkseagreen__padding_hover_100px__padding_hover_4__display_hover_dark_large_flex__display_hover_light_inline-flex__backgroundColor_hover_dark_blue\\.700__backgroundColor_hover_light_large_red\\.200__backgroundColor_hover_light_dark_ThreeDHighlight__padding_dark_24__backgroundColor_dark_red\\.800__backgroundColor_dark_whitesmoke__color_dark_hover_blue\\.600__display_dark_hover_light_flex__display_dark_hover_large_small_contents__1rxundp0:hover {
        display: inline-flex;
      }
      .light.large .tw__backgroundColor_blue\\.500__padding_24__borderRadius_lg__display_dark_hover_table-footer-group__color_navItem_hoverNotActive_brand\\.100__backgroundColor_hover_whitesmoke__borderRadius_hover_2xl__color_hover_darkseagreen__padding_hover_100px__padding_hover_4__display_hover_dark_large_flex__display_hover_light_inline-flex__backgroundColor_hover_dark_blue\\.700__backgroundColor_hover_light_large_red\\.200__backgroundColor_hover_light_dark_ThreeDHighlight__padding_dark_24__backgroundColor_dark_red\\.800__backgroundColor_dark_whitesmoke__color_dark_hover_blue\\.600__display_dark_hover_light_flex__display_dark_hover_large_small_contents__1rxundp0:hover {
        background-color: #FEB2B2;
      }
      .light.dark .tw__backgroundColor_blue\\.500__padding_24__borderRadius_lg__display_dark_hover_table-footer-group__color_navItem_hoverNotActive_brand\\.100__backgroundColor_hover_whitesmoke__borderRadius_hover_2xl__color_hover_darkseagreen__padding_hover_100px__padding_hover_4__display_hover_dark_large_flex__display_hover_light_inline-flex__backgroundColor_hover_dark_blue\\.700__backgroundColor_hover_light_large_red\\.200__backgroundColor_hover_light_dark_ThreeDHighlight__padding_dark_24__backgroundColor_dark_red\\.800__backgroundColor_dark_whitesmoke__color_dark_hover_blue\\.600__display_dark_hover_light_flex__display_dark_hover_large_small_contents__1rxundp0:hover {
        background-color: ThreeDHighlight;
      }
      .dark .tw__backgroundColor_blue\\.500__padding_24__borderRadius_lg__display_dark_hover_table-footer-group__color_navItem_hoverNotActive_brand\\.100__backgroundColor_hover_whitesmoke__borderRadius_hover_2xl__color_hover_darkseagreen__padding_hover_100px__padding_hover_4__display_hover_dark_large_flex__display_hover_light_inline-flex__backgroundColor_hover_dark_blue\\.700__backgroundColor_hover_light_large_red\\.200__backgroundColor_hover_light_dark_ThreeDHighlight__padding_dark_24__backgroundColor_dark_red\\.800__backgroundColor_dark_whitesmoke__color_dark_hover_blue\\.600__display_dark_hover_light_flex__display_dark_hover_large_small_contents__1rxundp0 {
        padding: 24px;
        background-color: whitesmoke;
      }
      .dark.light .tw__backgroundColor_blue\\.500__padding_24__borderRadius_lg__display_dark_hover_table-footer-group__color_navItem_hoverNotActive_brand\\.100__backgroundColor_hover_whitesmoke__borderRadius_hover_2xl__color_hover_darkseagreen__padding_hover_100px__padding_hover_4__display_hover_dark_large_flex__display_hover_light_inline-flex__backgroundColor_hover_dark_blue\\.700__backgroundColor_hover_light_large_red\\.200__backgroundColor_hover_light_dark_ThreeDHighlight__padding_dark_24__backgroundColor_dark_red\\.800__backgroundColor_dark_whitesmoke__color_dark_hover_blue\\.600__display_dark_hover_light_flex__display_dark_hover_large_small_contents__1rxundp0:hover {
        display: flex;
      }
      .dark.large.small .tw__backgroundColor_blue\\.500__padding_24__borderRadius_lg__display_dark_hover_table-footer-group__color_navItem_hoverNotActive_brand\\.100__backgroundColor_hover_whitesmoke__borderRadius_hover_2xl__color_hover_darkseagreen__padding_hover_100px__padding_hover_4__display_hover_dark_large_flex__display_hover_light_inline-flex__backgroundColor_hover_dark_blue\\.700__backgroundColor_hover_light_large_red\\.200__backgroundColor_hover_light_dark_ThreeDHighlight__padding_dark_24__backgroundColor_dark_red\\.800__backgroundColor_dark_whitesmoke__color_dark_hover_blue\\.600__display_dark_hover_light_flex__display_dark_hover_large_small_contents__1rxundp0:hover {
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
    const queryList = (extractDefs.get("defineProperties") as ExtractedFunctionResult).queryList;

    const configByName = new Map<string, { query: ExtractedFunctionInstance; config: GenericConfig }>();
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
    const extracted = extractResult.get(name)! as ExtractedComponentResult;

    const conf = configByName.get("tw")!;
    const boxStyles = generateStyleFromExtraction({
        name,
        extracted,
        config: conf.config,
    });

    const magicStr = new MagicString(sourceFile.getFullText());
    const generateStyleResults = new Set<ReturnType<typeof generateStyleFromExtraction>>();

    expect(boxStyles.classByDebugId.size).toMatchInlineSnapshot("4");
    expect(boxStyles.classByDebugId).toMatchInlineSnapshot(`
      {
          Box_display_flex: "Box_display_flex__1rxundp0",
          Box_padding_4: "Box_padding_4__1rxundp1",
          "Box_backgroundColor_blue.500": "Box_backgroundColor_blue.500__1rxundp2",
          Box_borderRadius_lg: "Box_borderRadius_lg__1rxundp3",
      }
    `);
    expect(boxStyles.allRules).toMatchInlineSnapshot(`
      [
          {
              name: "Box",
              type: "local",
              mode: "atomic",
              rule: {
                  display: "flex",
              },
              debugId: "Box_display_flex",
              propName: "display",
              value: "flex",
              token: "flex",
          },
          {
              name: "Box",
              type: "local",
              mode: "atomic",
              rule: {
                  padding: "4px",
              },
              debugId: "Box_padding_4",
              propName: "padding",
              value: "4px",
              token: 4,
          },
          {
              name: "Box",
              type: "local",
              mode: "atomic",
              rule: {
                  backgroundColor: "#3182ce",
              },
              debugId: "Box_backgroundColor_blue.500",
              propName: "backgroundColor",
              value: "#3182ce",
              token: "blue.500",
          },
          {
              name: "Box",
              type: "local",
              mode: "atomic",
              rule: {
                  borderRadius: "0.5rem",
              },
              debugId: "Box_borderRadius_lg",
              propName: "borderRadius",
              value: "0.5rem",
              token: "lg",
          },
      ]
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
    const queryList = (extractDefs.get("defineProperties") as ExtractedFunctionResult).queryList;

    const configByName = new Map<string, { query: ExtractedFunctionInstance; config: GenericConfig }>();
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
    const extracted = extractResult.get(name)! as ExtractedComponentResult;

    const conf = configByName.get("css")!;
    const globalStyles = generateStyleFromExtraction({ name, extracted, config: conf.config });

    expect(globalStyles.classByDebugId.size).toMatchInlineSnapshot("9");
    expect(globalStyles.classByDebugId).toMatchInlineSnapshot(`
      {
          css_fontSize_small_8px: "css_fontSize_small_8px__1rxundp0",
          css_fontSize_large_20px: "css_fontSize_large_20px__1rxundp1",
          css_backgroundColor_navItem_red: "css_backgroundColor_navItem_red__1rxundp2",
          css_fontSize_navItem_16px: "css_fontSize_navItem_16px__1rxundp3",
          css_backgroundColor_green: "css_backgroundColor_green__1rxundp4",
          css_display_flex: "css_display_flex__1rxundp5",
          css_color_blue: "css_color_blue__1rxundp6",
          css__fontSize_small_8px__fontSize_large_20px__backgroundColor_navItem_red__fontSize_navItem_16px__backgroundColor_green__display_flex__color_blue:
              "css__fontSize_small_8px__fontSize_large_20px__backgroundColor_navItem_red__fontSize_navItem_16px__backgroundColor_green__display_flex__color_blue__1rxundp7",
          css_colorScheme_dark: "css_colorScheme_dark__1rxundp8",
      }
    `);
    expect(globalStyles.allRules).toMatchInlineSnapshot(`
      [
          {
              name: "css",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      ".small &": {
                          fontSize: "8px",
                      },
                  },
              },
              debugId: "css_fontSize_small_8px",
              propName: "fontSize",
              value: "8px",
              token: "8px",
              conditionPath: ["small"],
          },
          {
              name: "css",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      ".large &": {
                          fontSize: "20px",
                      },
                  },
              },
              debugId: "css_fontSize_large_20px",
              propName: "fontSize",
              value: "20px",
              token: "20px",
              conditionPath: ["large"],
          },
          {
              name: "css",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      "nav li > &": {
                          backgroundColor: "red",
                      },
                  },
              },
              debugId: "css_backgroundColor_navItem_red",
              propName: "backgroundColor",
              value: "red",
              token: "red",
              conditionPath: ["navItem"],
          },
          {
              name: "css",
              type: "local",
              mode: "atomic",
              rule: {
                  selectors: {
                      "nav li > &": {
                          fontSize: "16px",
                      },
                  },
              },
              debugId: "css_fontSize_navItem_16px",
              propName: "fontSize",
              value: "16px",
              token: "16px",
              conditionPath: ["navItem"],
          },
          {
              name: "css",
              type: "local",
              mode: "atomic",
              rule: {
                  backgroundColor: "green",
              },
              debugId: "css_backgroundColor_green",
              propName: "backgroundColor",
              value: "green",
              token: "green",
          },
          {
              name: "css",
              type: "local",
              mode: "atomic",
              rule: {
                  display: "flex",
              },
              debugId: "css_display_flex",
              propName: "display",
              value: "flex",
              token: "flex",
          },
          {
              name: "css",
              type: "local",
              mode: "atomic",
              rule: {
                  color: "blue",
              },
              debugId: "css_color_blue",
              propName: "color",
              value: "blue",
              token: "blue",
          },
          {
              name: "css",
              mode: "grouped",
              type: "local",
              rule: {
                  selectors: {
                      ".small &": {
                          fontSize: "8px",
                      },
                      ".large &": {
                          fontSize: "20px",
                      },
                      "nav li > &": {
                          backgroundColor: "red",
                          fontSize: "16px",
                      },
                  },
                  backgroundColor: "green",
                  display: "flex",
                  color: "blue",
              },
              debugId:
                  "css__fontSize_small_8px__fontSize_large_20px__backgroundColor_navItem_red__fontSize_navItem_16px__backgroundColor_green__display_flex__color_blue",
              fromRules: [
                  {
                      name: "css",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".small &": {
                                  fontSize: "8px",
                              },
                              ".large &": {
                                  fontSize: "20px",
                              },
                              "nav li > &": {
                                  backgroundColor: "red",
                                  fontSize: "16px",
                              },
                          },
                          backgroundColor: "green",
                          display: "flex",
                          color: "blue",
                      },
                      debugId: "css_fontSize_small_8px",
                      propName: "fontSize",
                      value: "8px",
                      token: "8px",
                      conditionPath: ["small"],
                  },
                  {
                      name: "css",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".large &": {
                                  fontSize: "20px",
                              },
                          },
                      },
                      debugId: "css_fontSize_large_20px",
                      propName: "fontSize",
                      value: "20px",
                      token: "20px",
                      conditionPath: ["large"],
                  },
                  {
                      name: "css",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              "nav li > &": {
                                  backgroundColor: "red",
                              },
                          },
                      },
                      debugId: "css_backgroundColor_navItem_red",
                      propName: "backgroundColor",
                      value: "red",
                      token: "red",
                      conditionPath: ["navItem"],
                  },
                  {
                      name: "css",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              "nav li > &": {
                                  fontSize: "16px",
                              },
                          },
                      },
                      debugId: "css_fontSize_navItem_16px",
                      propName: "fontSize",
                      value: "16px",
                      token: "16px",
                      conditionPath: ["navItem"],
                  },
                  {
                      name: "css",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          backgroundColor: "green",
                      },
                      debugId: "css_backgroundColor_green",
                      propName: "backgroundColor",
                      value: "green",
                      token: "green",
                  },
                  {
                      name: "css",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          display: "flex",
                      },
                      debugId: "css_display_flex",
                      propName: "display",
                      value: "flex",
                      token: "flex",
                  },
                  {
                      name: "css",
                      type: "local",
                      mode: "atomic",
                      rule: {
                          color: "blue",
                      },
                      debugId: "css_color_blue",
                      propName: "color",
                      value: "blue",
                      token: "blue",
                  },
              ],
          },
          {
              name: "css",
              type: "global",
              mode: "grouped",
              debugId: "css_8_global__backgroundColor_green__display_flex__color_blue",
              rule: {
                  backgroundColor: "green",
                  display: "flex",
                  color: "blue",
              },
              fromRules: [
                  {
                      name: "css",
                      type: "global",
                      mode: "atomic",
                      rule: {
                          backgroundColor: "green",
                      },
                      debugId: "css_8_global_backgroundColor_green",
                      propName: "backgroundColor",
                      value: "green",
                      token: "green",
                  },
                  {
                      name: "css",
                      type: "global",
                      mode: "atomic",
                      rule: {
                          display: "flex",
                      },
                      debugId: "css_8_global_display_flex",
                      propName: "display",
                      value: "flex",
                      token: "flex",
                  },
                  {
                      name: "css",
                      type: "global",
                      mode: "atomic",
                      rule: {
                          color: "blue",
                      },
                      debugId: "css_8_global_color_blue",
                      propName: "color",
                      value: "blue",
                      token: "blue",
                  },
              ],
              selector: ":root",
          },
          {
              name: "css",
              type: "global",
              mode: "grouped",
              rule: {
                  fontSize: "8px",
              },
              debugId: "css_9_global__fontSize_small_8px",
              selector: ":root.small",
              fromRules: [
                  {
                      name: "css",
                      type: "global",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".small &": {
                                  fontSize: "8px",
                              },
                          },
                      },
                      debugId: "css_8_global_fontSize_small_8px",
                      propName: "fontSize",
                      value: "8px",
                      token: "8px",
                      conditionPath: ["small"],
                  },
              ],
          },
          {
              name: "css",
              type: "global",
              mode: "grouped",
              rule: {
                  fontSize: "20px",
              },
              debugId: "css_10_global__fontSize_large_20px",
              selector: ":root.large",
              fromRules: [
                  {
                      name: "css",
                      type: "global",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              ".large &": {
                                  fontSize: "20px",
                              },
                          },
                      },
                      debugId: "css_8_global_fontSize_large_20px",
                      propName: "fontSize",
                      value: "20px",
                      token: "20px",
                      conditionPath: ["large"],
                  },
              ],
          },
          {
              name: "css",
              type: "global",
              mode: "grouped",
              rule: {
                  backgroundColor: "red",
                  fontSize: "16px",
              },
              debugId: "css_11_global__backgroundColor_navItem_red__fontSize_navItem_16px",
              selector: ":root nav li > *",
              fromRules: [
                  {
                      name: "css",
                      type: "global",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              "nav li > &": {
                                  backgroundColor: "red",
                              },
                          },
                      },
                      debugId: "css_8_global_backgroundColor_navItem_red",
                      propName: "backgroundColor",
                      value: "red",
                      token: "red",
                      conditionPath: ["navItem"],
                  },
                  {
                      name: "css",
                      type: "global",
                      mode: "atomic",
                      rule: {
                          selectors: {
                              "nav li > &": {
                                  fontSize: "16px",
                              },
                          },
                      },
                      debugId: "css_8_global_fontSize_navItem_16px",
                      propName: "fontSize",
                      value: "16px",
                      token: "16px",
                      conditionPath: ["navItem"],
                  },
              ],
          },
          {
              name: "css",
              type: "global",
              mode: "grouped",
              debugId: "css_12_global__display_grid__fontWeight_bold",
              rule: {
                  display: "grid",
                  fontWeight: "bold",
              },
              fromRules: [
                  {
                      name: "css",
                      type: "global",
                      mode: "atomic",
                      rule: {
                          display: "grid",
                      },
                      debugId: "css_12_global_display_grid",
                      propName: "display",
                      value: "grid",
                      token: "grid",
                  },
                  {
                      name: "css",
                      type: "global",
                      mode: "atomic",
                      rule: {
                          fontWeight: "bold",
                      },
                      debugId: "css_12_global_fontWeight_bold",
                      propName: "fontWeight",
                      value: "bold",
                      token: "bold",
                  },
              ],
              selector: "body",
          },
          {
              name: "css",
              type: "global",
              mode: "grouped",
              debugId: "css_13_global__colorScheme_dark__vars_6",
              rule: {
                  colorScheme: "dark",
                  vars: {
                      "var(--color-mainBg__1du39r70)": "#39539b",
                      "var(--color-secondaryBg__1du39r71)": "#324989",
                      "var(--color-text__1du39r72)": "#63b3ed",
                      "var(--color-bg__1du39r73)": "#8297d1",
                      "var(--color-bgSecondary__1du39r74)": "#2b3f76",
                      "var(--color-bgHover__1du39r75)": "#324989",
                  },
              },
              fromRules: [
                  {
                      name: "css",
                      type: "global",
                      mode: "atomic",
                      rule: {
                          colorScheme: "dark",
                      },
                      debugId: "css_13_global_colorScheme_dark",
                      propName: "colorScheme",
                      value: "dark",
                      token: "dark",
                  },
                  {
                      name: "css",
                      type: "global",
                      mode: "atomic",
                      rule: {
                          vars: {
                              "var(--color-mainBg__1du39r70)": "#39539b",
                              "var(--color-secondaryBg__1du39r71)": "#324989",
                              "var(--color-text__1du39r72)": "#63b3ed",
                              "var(--color-bg__1du39r73)": "#8297d1",
                              "var(--color-bgSecondary__1du39r74)": "#2b3f76",
                              "var(--color-bgHover__1du39r75)": "#324989",
                          },
                      },
                      propName: "vars",
                      value: 6,
                      token: 6,
                      debugId: "css_vars_6",
                  },
              ],
              selector: ".dark",
          },
          {
              name: "css",
              type: "local",
              mode: "atomic",
              rule: {
                  colorScheme: "dark",
              },
              debugId: "css_colorScheme_dark",
              propName: "colorScheme",
              value: "dark",
              token: "dark",
          },
      ]
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
              const localClassNameGrouped = "css__fontSize_small_8px__fontSize_large_20px__backgroundColor_navItem_red__fontSize_navItem_16px__backgroundColor_green__display_flex__color_blue__1rxundp7";;;

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
      .css__fontSize_small_8px__fontSize_large_20px__backgroundColor_navItem_red__fontSize_navItem_16px__backgroundColor_green__display_flex__color_blue__1rxundp7 {
        background-color: green;
        display: flex;
        color: blue;
      }
      .small .css__fontSize_small_8px__fontSize_large_20px__backgroundColor_navItem_red__fontSize_navItem_16px__backgroundColor_green__display_flex__color_blue__1rxundp7 {
        font-size: 8px;
      }
      .large .css__fontSize_small_8px__fontSize_large_20px__backgroundColor_navItem_red__fontSize_navItem_16px__backgroundColor_green__display_flex__color_blue__1rxundp7 {
        font-size: 20px;
      }
      nav li > .css__fontSize_small_8px__fontSize_large_20px__backgroundColor_navItem_red__fontSize_navItem_16px__backgroundColor_green__display_flex__color_blue__1rxundp7 {
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
