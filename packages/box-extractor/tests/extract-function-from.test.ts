import { Project, SourceFile, ts } from "ts-morph";
import { afterEach, expect, it } from "vitest";
import { extractFunctionFrom } from "../src/extractor/extractFunctionFrom";

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

it("can extract function args when imported from a specific module", () => {
    const code = `
    import { createTheme, defineProperties } from "@box-extractor/vanilla-wind";

    export const [coreThemeClass,coreThemeVars] = ["_1dghp000", {
        "space": {
            "none": "var(--space-none__1dghp001)",
            "px": "var(--space-px__1dghp002)",
            "xsm": "var(--space-xsm__1dghp003)",
            "small": "var(--space-small__1dghp004)",
            "sm": "var(--space-sm__1dghp005)",
            "md": "var(--space-md__1dghp006)",
            "lg": "var(--space-lg__1dghp007)",
            "xl": "var(--space-xl__1dghp008)",
            "xxl": "var(--space-xxl__1dghp009)",
            "xxxl": "var(--space-xxxl__1dghp00a)",
            "xxxxl": "var(--space-xxxxl__1dghp00b)"
        },
        "size": {
            "none": "var(--size-none__1dghp00c)",
            "px": "var(--size-px__1dghp00d)",
            "1/2": "var(--size-1\\/2__1dghp00e)",
            "1/3": "var(--size-1\\/3__1dghp00f)",
            "2/3": "var(--size-2\\/3__1dghp00g)",
            "1/4": "var(--size-1\\/4__1dghp00h)",
            "2/4": "var(--size-2\\/4__1dghp00i)",
            "3/4": "var(--size-3\\/4__1dghp00j)",
            "1/5": "var(--size-1\\/5__1dghp00k)",
            "2/5": "var(--size-2\\/5__1dghp00l)",
            "3/5": "var(--size-3\\/5__1dghp00m)",
            "4/5": "var(--size-4\\/5__1dghp00n)",
            "1/6": "var(--size-1\\/6__1dghp00o)",
            "full": "var(--size-full__1dghp00p)"
        },
        "transition": {
            "fast": "var(--transition-fast__1dghp00q)",
            "slow": "var(--transition-slow__1dghp00r)"
        },
        "backgroundColor": {
            "error": "var(--backgroundColor-error__1dghp00s)",
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
        conditions: {
            mobile: { "@media": "screen and (max-width: 767px)" },
            tablet: { "@media": "screen and (min-width: 768px) and (max-width: 1023px)" },
            desktop: { "@media": "screen and (min-width: 1024px)" },
        },
        properties: {
            display: true,
            flexDirection: true,
            flexGrow: true,
            justifyContent: true,
            alignItems: true,
            position: true,
            backgroundColor: coreThemeVars.backgroundColor,
            borderRadius: coreThemeVars.space,
            gap: coreThemeVars.space,
            width: coreThemeVars.size,
            height: coreThemeVars.size,
            padding: coreThemeVars.space,
            margin: coreThemeVars.space,
            paddingTop: coreThemeVars.space,
            paddingBottom: coreThemeVars.space,
            paddingLeft: coreThemeVars.space,
            paddingRight: coreThemeVars.space,
            marginTop: coreThemeVars.space,
            marginBottom: coreThemeVars.space,
            marginLeft: coreThemeVars.space,
            marginRight: coreThemeVars.space,
            transition: coreThemeVars.transition,
            color: coreThemeVars.color,
        },
        shorthands: {
            margin: ["marginTop", "marginRight", "marginBottom", "marginLeft"],
            paddingXY: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"],
            marginX: ["marginLeft", "marginRight"],
            marginY: ["marginTop", "marginBottom"],
            paddingX: ["paddingLeft", "paddingRight"],
            paddingY: ["paddingTop", "paddingBottom"],
        },
    });
    `;

    const sourceFile = project.createSourceFile("var-usage.ts", code, { scriptKind: ts.ScriptKind.TSX });
    const extracted = extractFunctionFrom(sourceFile, "defineProperties", "@box-extractor/vanilla-wind");

    expect(extracted).toMatchInlineSnapshot(`
      {
          sprinklesFn: {
              result: {
                  conditions: {
                      mobile: {
                          "@media": "screen and (max-width: 767px)",
                      },
                      tablet: {
                          "@media": "screen and (min-width: 768px) and (max-width: 1023px)",
                      },
                      desktop: {
                          "@media": "screen and (min-width: 1024px)",
                      },
                  },
                  properties: {
                      display: true,
                      flexDirection: true,
                      flexGrow: true,
                      justifyContent: true,
                      alignItems: true,
                      position: true,
                      backgroundColor: {
                          error: "var(--backgroundColor-error__1dghp00s)",
                          warning: "var(--backgroundColor-warning__1dghp00t)",
                      },
                      borderRadius: {
                          none: "var(--space-none__1dghp001)",
                          px: "var(--space-px__1dghp002)",
                          xsm: "var(--space-xsm__1dghp003)",
                          small: "var(--space-small__1dghp004)",
                          sm: "var(--space-sm__1dghp005)",
                          md: "var(--space-md__1dghp006)",
                          lg: "var(--space-lg__1dghp007)",
                          xl: "var(--space-xl__1dghp008)",
                          xxl: "var(--space-xxl__1dghp009)",
                          xxxl: "var(--space-xxxl__1dghp00a)",
                          xxxxl: "var(--space-xxxxl__1dghp00b)",
                      },
                      gap: {
                          none: "var(--space-none__1dghp001)",
                          px: "var(--space-px__1dghp002)",
                          xsm: "var(--space-xsm__1dghp003)",
                          small: "var(--space-small__1dghp004)",
                          sm: "var(--space-sm__1dghp005)",
                          md: "var(--space-md__1dghp006)",
                          lg: "var(--space-lg__1dghp007)",
                          xl: "var(--space-xl__1dghp008)",
                          xxl: "var(--space-xxl__1dghp009)",
                          xxxl: "var(--space-xxxl__1dghp00a)",
                          xxxxl: "var(--space-xxxxl__1dghp00b)",
                      },
                      width: {
                          none: "var(--size-none__1dghp00c)",
                          px: "var(--size-px__1dghp00d)",
                          "1/2": "var(--size-1/2__1dghp00e)",
                          "1/3": "var(--size-1/3__1dghp00f)",
                          "2/3": "var(--size-2/3__1dghp00g)",
                          "1/4": "var(--size-1/4__1dghp00h)",
                          "2/4": "var(--size-2/4__1dghp00i)",
                          "3/4": "var(--size-3/4__1dghp00j)",
                          "1/5": "var(--size-1/5__1dghp00k)",
                          "2/5": "var(--size-2/5__1dghp00l)",
                          "3/5": "var(--size-3/5__1dghp00m)",
                          "4/5": "var(--size-4/5__1dghp00n)",
                          "1/6": "var(--size-1/6__1dghp00o)",
                          full: "var(--size-full__1dghp00p)",
                      },
                      height: {
                          none: "var(--size-none__1dghp00c)",
                          px: "var(--size-px__1dghp00d)",
                          "1/2": "var(--size-1/2__1dghp00e)",
                          "1/3": "var(--size-1/3__1dghp00f)",
                          "2/3": "var(--size-2/3__1dghp00g)",
                          "1/4": "var(--size-1/4__1dghp00h)",
                          "2/4": "var(--size-2/4__1dghp00i)",
                          "3/4": "var(--size-3/4__1dghp00j)",
                          "1/5": "var(--size-1/5__1dghp00k)",
                          "2/5": "var(--size-2/5__1dghp00l)",
                          "3/5": "var(--size-3/5__1dghp00m)",
                          "4/5": "var(--size-4/5__1dghp00n)",
                          "1/6": "var(--size-1/6__1dghp00o)",
                          full: "var(--size-full__1dghp00p)",
                      },
                      padding: {
                          none: "var(--space-none__1dghp001)",
                          px: "var(--space-px__1dghp002)",
                          xsm: "var(--space-xsm__1dghp003)",
                          small: "var(--space-small__1dghp004)",
                          sm: "var(--space-sm__1dghp005)",
                          md: "var(--space-md__1dghp006)",
                          lg: "var(--space-lg__1dghp007)",
                          xl: "var(--space-xl__1dghp008)",
                          xxl: "var(--space-xxl__1dghp009)",
                          xxxl: "var(--space-xxxl__1dghp00a)",
                          xxxxl: "var(--space-xxxxl__1dghp00b)",
                      },
                      margin: {
                          none: "var(--space-none__1dghp001)",
                          px: "var(--space-px__1dghp002)",
                          xsm: "var(--space-xsm__1dghp003)",
                          small: "var(--space-small__1dghp004)",
                          sm: "var(--space-sm__1dghp005)",
                          md: "var(--space-md__1dghp006)",
                          lg: "var(--space-lg__1dghp007)",
                          xl: "var(--space-xl__1dghp008)",
                          xxl: "var(--space-xxl__1dghp009)",
                          xxxl: "var(--space-xxxl__1dghp00a)",
                          xxxxl: "var(--space-xxxxl__1dghp00b)",
                      },
                      paddingTop: {
                          none: "var(--space-none__1dghp001)",
                          px: "var(--space-px__1dghp002)",
                          xsm: "var(--space-xsm__1dghp003)",
                          small: "var(--space-small__1dghp004)",
                          sm: "var(--space-sm__1dghp005)",
                          md: "var(--space-md__1dghp006)",
                          lg: "var(--space-lg__1dghp007)",
                          xl: "var(--space-xl__1dghp008)",
                          xxl: "var(--space-xxl__1dghp009)",
                          xxxl: "var(--space-xxxl__1dghp00a)",
                          xxxxl: "var(--space-xxxxl__1dghp00b)",
                      },
                      paddingBottom: {
                          none: "var(--space-none__1dghp001)",
                          px: "var(--space-px__1dghp002)",
                          xsm: "var(--space-xsm__1dghp003)",
                          small: "var(--space-small__1dghp004)",
                          sm: "var(--space-sm__1dghp005)",
                          md: "var(--space-md__1dghp006)",
                          lg: "var(--space-lg__1dghp007)",
                          xl: "var(--space-xl__1dghp008)",
                          xxl: "var(--space-xxl__1dghp009)",
                          xxxl: "var(--space-xxxl__1dghp00a)",
                          xxxxl: "var(--space-xxxxl__1dghp00b)",
                      },
                      paddingLeft: {
                          none: "var(--space-none__1dghp001)",
                          px: "var(--space-px__1dghp002)",
                          xsm: "var(--space-xsm__1dghp003)",
                          small: "var(--space-small__1dghp004)",
                          sm: "var(--space-sm__1dghp005)",
                          md: "var(--space-md__1dghp006)",
                          lg: "var(--space-lg__1dghp007)",
                          xl: "var(--space-xl__1dghp008)",
                          xxl: "var(--space-xxl__1dghp009)",
                          xxxl: "var(--space-xxxl__1dghp00a)",
                          xxxxl: "var(--space-xxxxl__1dghp00b)",
                      },
                      paddingRight: {
                          none: "var(--space-none__1dghp001)",
                          px: "var(--space-px__1dghp002)",
                          xsm: "var(--space-xsm__1dghp003)",
                          small: "var(--space-small__1dghp004)",
                          sm: "var(--space-sm__1dghp005)",
                          md: "var(--space-md__1dghp006)",
                          lg: "var(--space-lg__1dghp007)",
                          xl: "var(--space-xl__1dghp008)",
                          xxl: "var(--space-xxl__1dghp009)",
                          xxxl: "var(--space-xxxl__1dghp00a)",
                          xxxxl: "var(--space-xxxxl__1dghp00b)",
                      },
                      marginTop: {
                          none: "var(--space-none__1dghp001)",
                          px: "var(--space-px__1dghp002)",
                          xsm: "var(--space-xsm__1dghp003)",
                          small: "var(--space-small__1dghp004)",
                          sm: "var(--space-sm__1dghp005)",
                          md: "var(--space-md__1dghp006)",
                          lg: "var(--space-lg__1dghp007)",
                          xl: "var(--space-xl__1dghp008)",
                          xxl: "var(--space-xxl__1dghp009)",
                          xxxl: "var(--space-xxxl__1dghp00a)",
                          xxxxl: "var(--space-xxxxl__1dghp00b)",
                      },
                      marginBottom: {
                          none: "var(--space-none__1dghp001)",
                          px: "var(--space-px__1dghp002)",
                          xsm: "var(--space-xsm__1dghp003)",
                          small: "var(--space-small__1dghp004)",
                          sm: "var(--space-sm__1dghp005)",
                          md: "var(--space-md__1dghp006)",
                          lg: "var(--space-lg__1dghp007)",
                          xl: "var(--space-xl__1dghp008)",
                          xxl: "var(--space-xxl__1dghp009)",
                          xxxl: "var(--space-xxxl__1dghp00a)",
                          xxxxl: "var(--space-xxxxl__1dghp00b)",
                      },
                      marginLeft: {
                          none: "var(--space-none__1dghp001)",
                          px: "var(--space-px__1dghp002)",
                          xsm: "var(--space-xsm__1dghp003)",
                          small: "var(--space-small__1dghp004)",
                          sm: "var(--space-sm__1dghp005)",
                          md: "var(--space-md__1dghp006)",
                          lg: "var(--space-lg__1dghp007)",
                          xl: "var(--space-xl__1dghp008)",
                          xxl: "var(--space-xxl__1dghp009)",
                          xxxl: "var(--space-xxxl__1dghp00a)",
                          xxxxl: "var(--space-xxxxl__1dghp00b)",
                      },
                      marginRight: {
                          none: "var(--space-none__1dghp001)",
                          px: "var(--space-px__1dghp002)",
                          xsm: "var(--space-xsm__1dghp003)",
                          small: "var(--space-small__1dghp004)",
                          sm: "var(--space-sm__1dghp005)",
                          md: "var(--space-md__1dghp006)",
                          lg: "var(--space-lg__1dghp007)",
                          xl: "var(--space-xl__1dghp008)",
                          xxl: "var(--space-xxl__1dghp009)",
                          xxxl: "var(--space-xxxl__1dghp00a)",
                          xxxxl: "var(--space-xxxxl__1dghp00b)",
                      },
                      transition: {
                          fast: "var(--transition-fast__1dghp00q)",
                          slow: "var(--transition-slow__1dghp00r)",
                      },
                      color: {
                          white: "var(--color-white__1dghp00u)",
                          black: "var(--color-black__1dghp00v)",
                          error: "var(--color-error__1dghp00w)",
                          warning: "var(--color-warning__1dghp00x)",
                      },
                  },
                  shorthands: {
                      margin: ["marginTop", "marginRight", "marginBottom", "marginLeft"],
                      paddingXY: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"],
                      marginX: ["marginLeft", "marginRight"],
                      marginY: ["marginTop", "marginBottom"],
                      paddingX: ["paddingLeft", "paddingRight"],
                      paddingY: ["paddingTop", "paddingBottom"],
                  },
              },
              queryBox: {
                  type: "map",
                  value: {
                      conditions: [
                          {
                              type: "map",
                              value: {
                                  mobile: [
                                      {
                                          type: "map",
                                          value: {
                                              "@media": [
                                                  {
                                                      type: "literal",
                                                      value: "screen and (max-width: 767px)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                      },
                                  ],
                                  tablet: [
                                      {
                                          type: "map",
                                          value: {
                                              "@media": [
                                                  {
                                                      type: "literal",
                                                      value: "screen and (min-width: 768px) and (max-width: 1023px)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                      },
                                  ],
                                  desktop: [
                                      {
                                          type: "map",
                                          value: {
                                              "@media": [
                                                  {
                                                      type: "literal",
                                                      value: "screen and (min-width: 1024px)",
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
                                  flexDirection: [
                                      {
                                          type: "literal",
                                          value: true,
                                          kind: "boolean",
                                          getNode: "TrueKeyword",
                                      },
                                  ],
                                  flexGrow: [
                                      {
                                          type: "literal",
                                          value: true,
                                          kind: "boolean",
                                          getNode: "TrueKeyword",
                                      },
                                  ],
                                  justifyContent: [
                                      {
                                          type: "literal",
                                          value: true,
                                          kind: "boolean",
                                          getNode: "TrueKeyword",
                                      },
                                  ],
                                  alignItems: [
                                      {
                                          type: "literal",
                                          value: true,
                                          kind: "boolean",
                                          getNode: "TrueKeyword",
                                      },
                                  ],
                                  position: [
                                      {
                                          type: "literal",
                                          value: true,
                                          kind: "boolean",
                                          getNode: "TrueKeyword",
                                      },
                                  ],
                                  backgroundColor: [
                                      {
                                          type: "map",
                                          value: {
                                              error: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--backgroundColor-error__1dghp00s)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              warning: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--backgroundColor-warning__1dghp00t)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                          fromNode: "Identifier",
                                      },
                                  ],
                                  borderRadius: [
                                      {
                                          type: "map",
                                          value: {
                                              none: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-none__1dghp001)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              px: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-px__1dghp002)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xsm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xsm__1dghp003)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              small: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-small__1dghp004)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              sm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-sm__1dghp005)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              md: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-md__1dghp006)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              lg: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-lg__1dghp007)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xl__1dghp008)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxl__1dghp009)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxl__1dghp00a)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxxl__1dghp00b)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                          fromNode: "Identifier",
                                      },
                                  ],
                                  gap: [
                                      {
                                          type: "map",
                                          value: {
                                              none: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-none__1dghp001)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              px: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-px__1dghp002)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xsm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xsm__1dghp003)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              small: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-small__1dghp004)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              sm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-sm__1dghp005)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              md: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-md__1dghp006)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              lg: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-lg__1dghp007)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xl__1dghp008)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxl__1dghp009)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxl__1dghp00a)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxxl__1dghp00b)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                          fromNode: "Identifier",
                                      },
                                  ],
                                  width: [
                                      {
                                          type: "map",
                                          value: {
                                              none: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-none__1dghp00c)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              px: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-px__1dghp00d)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "1/2": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-1/2__1dghp00e)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "1/3": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-1/3__1dghp00f)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "2/3": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-2/3__1dghp00g)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "1/4": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-1/4__1dghp00h)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "2/4": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-2/4__1dghp00i)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "3/4": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-3/4__1dghp00j)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "1/5": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-1/5__1dghp00k)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "2/5": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-2/5__1dghp00l)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "3/5": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-3/5__1dghp00m)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "4/5": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-4/5__1dghp00n)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "1/6": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-1/6__1dghp00o)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              full: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-full__1dghp00p)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                          fromNode: "Identifier",
                                      },
                                  ],
                                  height: [
                                      {
                                          type: "map",
                                          value: {
                                              none: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-none__1dghp00c)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              px: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-px__1dghp00d)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "1/2": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-1/2__1dghp00e)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "1/3": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-1/3__1dghp00f)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "2/3": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-2/3__1dghp00g)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "1/4": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-1/4__1dghp00h)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "2/4": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-2/4__1dghp00i)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "3/4": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-3/4__1dghp00j)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "1/5": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-1/5__1dghp00k)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "2/5": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-2/5__1dghp00l)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "3/5": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-3/5__1dghp00m)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "4/5": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-4/5__1dghp00n)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              "1/6": [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-1/6__1dghp00o)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              full: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--size-full__1dghp00p)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                          fromNode: "Identifier",
                                      },
                                  ],
                                  padding: [
                                      {
                                          type: "map",
                                          value: {
                                              none: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-none__1dghp001)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              px: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-px__1dghp002)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xsm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xsm__1dghp003)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              small: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-small__1dghp004)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              sm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-sm__1dghp005)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              md: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-md__1dghp006)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              lg: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-lg__1dghp007)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xl__1dghp008)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxl__1dghp009)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxl__1dghp00a)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxxl__1dghp00b)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                          fromNode: "Identifier",
                                      },
                                  ],
                                  margin: [
                                      {
                                          type: "map",
                                          value: {
                                              none: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-none__1dghp001)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              px: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-px__1dghp002)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xsm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xsm__1dghp003)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              small: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-small__1dghp004)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              sm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-sm__1dghp005)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              md: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-md__1dghp006)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              lg: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-lg__1dghp007)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xl__1dghp008)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxl__1dghp009)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxl__1dghp00a)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxxl__1dghp00b)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                          fromNode: "Identifier",
                                      },
                                  ],
                                  paddingTop: [
                                      {
                                          type: "map",
                                          value: {
                                              none: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-none__1dghp001)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              px: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-px__1dghp002)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xsm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xsm__1dghp003)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              small: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-small__1dghp004)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              sm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-sm__1dghp005)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              md: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-md__1dghp006)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              lg: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-lg__1dghp007)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xl__1dghp008)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxl__1dghp009)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxl__1dghp00a)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxxl__1dghp00b)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                          fromNode: "Identifier",
                                      },
                                  ],
                                  paddingBottom: [
                                      {
                                          type: "map",
                                          value: {
                                              none: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-none__1dghp001)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              px: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-px__1dghp002)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xsm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xsm__1dghp003)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              small: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-small__1dghp004)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              sm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-sm__1dghp005)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              md: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-md__1dghp006)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              lg: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-lg__1dghp007)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xl__1dghp008)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxl__1dghp009)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxl__1dghp00a)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxxl__1dghp00b)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                          fromNode: "Identifier",
                                      },
                                  ],
                                  paddingLeft: [
                                      {
                                          type: "map",
                                          value: {
                                              none: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-none__1dghp001)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              px: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-px__1dghp002)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xsm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xsm__1dghp003)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              small: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-small__1dghp004)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              sm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-sm__1dghp005)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              md: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-md__1dghp006)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              lg: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-lg__1dghp007)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xl__1dghp008)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxl__1dghp009)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxl__1dghp00a)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxxl__1dghp00b)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                          fromNode: "Identifier",
                                      },
                                  ],
                                  paddingRight: [
                                      {
                                          type: "map",
                                          value: {
                                              none: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-none__1dghp001)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              px: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-px__1dghp002)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xsm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xsm__1dghp003)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              small: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-small__1dghp004)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              sm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-sm__1dghp005)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              md: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-md__1dghp006)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              lg: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-lg__1dghp007)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xl__1dghp008)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxl__1dghp009)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxl__1dghp00a)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxxl__1dghp00b)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                          fromNode: "Identifier",
                                      },
                                  ],
                                  marginTop: [
                                      {
                                          type: "map",
                                          value: {
                                              none: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-none__1dghp001)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              px: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-px__1dghp002)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xsm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xsm__1dghp003)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              small: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-small__1dghp004)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              sm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-sm__1dghp005)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              md: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-md__1dghp006)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              lg: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-lg__1dghp007)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xl__1dghp008)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxl__1dghp009)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxl__1dghp00a)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxxl__1dghp00b)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                          fromNode: "Identifier",
                                      },
                                  ],
                                  marginBottom: [
                                      {
                                          type: "map",
                                          value: {
                                              none: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-none__1dghp001)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              px: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-px__1dghp002)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xsm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xsm__1dghp003)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              small: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-small__1dghp004)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              sm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-sm__1dghp005)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              md: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-md__1dghp006)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              lg: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-lg__1dghp007)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xl__1dghp008)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxl__1dghp009)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxl__1dghp00a)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxxl__1dghp00b)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                          fromNode: "Identifier",
                                      },
                                  ],
                                  marginLeft: [
                                      {
                                          type: "map",
                                          value: {
                                              none: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-none__1dghp001)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              px: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-px__1dghp002)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xsm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xsm__1dghp003)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              small: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-small__1dghp004)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              sm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-sm__1dghp005)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              md: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-md__1dghp006)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              lg: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-lg__1dghp007)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xl__1dghp008)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxl__1dghp009)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxl__1dghp00a)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxxl__1dghp00b)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                          fromNode: "Identifier",
                                      },
                                  ],
                                  marginRight: [
                                      {
                                          type: "map",
                                          value: {
                                              none: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-none__1dghp001)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              px: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-px__1dghp002)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xsm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xsm__1dghp003)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              small: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-small__1dghp004)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              sm: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-sm__1dghp005)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              md: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-md__1dghp006)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              lg: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-lg__1dghp007)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xl__1dghp008)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxl__1dghp009)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxl__1dghp00a)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              xxxxl: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--space-xxxxl__1dghp00b)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                          fromNode: "Identifier",
                                      },
                                  ],
                                  transition: [
                                      {
                                          type: "map",
                                          value: {
                                              fast: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--transition-fast__1dghp00q)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              slow: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--transition-slow__1dghp00r)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                          },
                                          getNode: "ObjectLiteralExpression",
                                          fromNode: "Identifier",
                                      },
                                  ],
                                  color: [
                                      {
                                          type: "map",
                                          value: {
                                              white: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--color-white__1dghp00u)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              black: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--color-black__1dghp00v)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              error: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--color-error__1dghp00w)",
                                                      kind: "string",
                                                      getNode: "StringLiteral",
                                                  },
                                              ],
                                              warning: [
                                                  {
                                                      type: "literal",
                                                      value: "var(--color-warning__1dghp00x)",
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
                              getNode: "ObjectLiteralExpression",
                              fromNode: "CallExpression",
                          },
                      ],
                      shorthands: [
                          {
                              type: "map",
                              value: {
                                  margin: [
                                      {
                                          type: "list",
                                          value: [
                                              {
                                                  type: "literal",
                                                  value: "marginTop",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                              {
                                                  type: "literal",
                                                  value: "marginRight",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                              {
                                                  type: "literal",
                                                  value: "marginBottom",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                              {
                                                  type: "literal",
                                                  value: "marginLeft",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                          ],
                                          getNode: "ArrayLiteralExpression",
                                      },
                                  ],
                                  paddingXY: [
                                      {
                                          type: "list",
                                          value: [
                                              {
                                                  type: "literal",
                                                  value: "paddingTop",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                              {
                                                  type: "literal",
                                                  value: "paddingRight",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                              {
                                                  type: "literal",
                                                  value: "paddingBottom",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                              {
                                                  type: "literal",
                                                  value: "paddingLeft",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                          ],
                                          getNode: "ArrayLiteralExpression",
                                      },
                                  ],
                                  marginX: [
                                      {
                                          type: "list",
                                          value: [
                                              {
                                                  type: "literal",
                                                  value: "marginLeft",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                              {
                                                  type: "literal",
                                                  value: "marginRight",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                          ],
                                          getNode: "ArrayLiteralExpression",
                                      },
                                  ],
                                  marginY: [
                                      {
                                          type: "list",
                                          value: [
                                              {
                                                  type: "literal",
                                                  value: "marginTop",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                              {
                                                  type: "literal",
                                                  value: "marginBottom",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                          ],
                                          getNode: "ArrayLiteralExpression",
                                      },
                                  ],
                                  paddingX: [
                                      {
                                          type: "list",
                                          value: [
                                              {
                                                  type: "literal",
                                                  value: "paddingLeft",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                              {
                                                  type: "literal",
                                                  value: "paddingRight",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                          ],
                                          getNode: "ArrayLiteralExpression",
                                      },
                                  ],
                                  paddingY: [
                                      {
                                          type: "list",
                                          value: [
                                              {
                                                  type: "literal",
                                                  value: "paddingTop",
                                                  kind: "string",
                                                  getNode: "StringLiteral",
                                              },
                                              {
                                                  type: "literal",
                                                  value: "paddingBottom",
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
      }
    `);

    const missingModule = extractFunctionFrom(sourceFile, "defineProperties", "@another/module");
    expect(missingModule).toMatchInlineSnapshot('{}');
});
