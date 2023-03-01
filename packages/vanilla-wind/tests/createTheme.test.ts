import { Project, SourceFile, ts } from "ts-morph";
import { afterEach, expect, test } from "vitest";
import { extractCreateTheme } from "../src/extractCreateTheme";

type Nullable<T> = T | null | undefined;

export const isNotNullish = <T>(element: Nullable<T>): element is T => element != null;

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

const project = createProject();

let sourceFile: SourceFile;
afterEach(() => {
    if (!sourceFile) return;

    if (sourceFile.wasForgotten()) return;
    project.removeSourceFile(sourceFile);
});

const withImportAndTokens = `
    import { ConfigConditions, createTheme, defineProperties } from "@box-extractor/vanilla-wind";

    /** azraqblue */
    export const primary = {
        "50": "#cdd5ed",
        "100": "#a7b6df",
        "200": "#95a7d8",
        "300": "#8297d1",
        "400": "#6f88cb",
        "500": "#4a69bd",
        "600": "#39539b",
        "700": "#324989",
        "800": "#2b3f76",
        "900": "#1d2b51",
    } as const;

`;

test("extractCreateTheme - createTheme - basic -> VE:createTheme", () => {
    const code = `${withImportAndTokens}

    export const [lightClassName, lightThemeVars] = createTheme({
        color: {
            mainBg: primary["200"],
            secondaryBg: primary["300"],
            text: primary["400"],
            bg: primary["600"],
            bgSecondary: primary["400"],
            bgHover: primary["100"],
        },
    });
`;
    const extracted = extractCreateTheme(project, code, "theme.ts");
    if (!extracted) {
        throw new Error("No theme extracted");
    }

    expect(extracted.css).toMatchInlineSnapshot(`
      "._1tja2sa0 {
        --color-mainBg__1tja2sa1: #95a7d8;
        --color-secondaryBg__1tja2sa2: #8297d1;
        --color-text__1tja2sa3: #6f88cb;
        --color-bg__1tja2sa4: #39539b;
        --color-bgSecondary__1tja2sa5: #6f88cb;
        --color-bgHover__1tja2sa6: #a7b6df;
      }"
    `);
    expect(extracted.content.replace(withImportAndTokens, "").trimStart()).toMatchInlineSnapshot(`
      "export const [lightClassName, lightThemeVars] = [
              "_1tja2sa0",
              {
                  "color": {
                      "mainBg": "var(--color-mainBg__1tja2sa1)",
                      "secondaryBg": "var(--color-secondaryBg__1tja2sa2)",
                      "text": "var(--color-text__1tja2sa3)",
                      "bg": "var(--color-bg__1tja2sa4)",
                      "bgSecondary": "var(--color-bgSecondary__1tja2sa5)",
                      "bgHover": "var(--color-bgHover__1tja2sa6)"
                  }
              }
          ] as const;
      "
    `);
});

test("extractCreateTheme - createTheme - make contract -> VE:createThemeContract", () => {
    const code = `${withImportAndTokens}

    export const lightThemeVars = createTheme("contract", {
        color: {
            mainBg: primary["200"],
            secondaryBg: primary["300"],
            text: primary["400"],
            bg: primary["600"],
            bgSecondary: primary["400"],
            bgHover: primary["100"],
        },
    });
`;
    const extracted = extractCreateTheme(project, code, "theme.ts");
    if (!extracted) {
        throw new Error("No theme extracted");
    }

    expect(extracted.css).toMatchInlineSnapshot("undefined");
    expect(extracted.content.replace(withImportAndTokens, "").trimStart()).toMatchInlineSnapshot(`
      "export const lightThemeVars = {
              "color": {
                  "mainBg": "var(--color-mainBg__1tja2sa0)",
                  "secondaryBg": "var(--color-secondaryBg__1tja2sa1)",
                  "text": "var(--color-text__1tja2sa2)",
                  "bg": "var(--color-bg__1tja2sa3)",
                  "bgSecondary": "var(--color-bgSecondary__1tja2sa4)",
                  "bgHover": "var(--color-bgHover__1tja2sa5)"
              }
          } as const;
      "
    `);
});

test("extractCreateTheme - createTheme - using contract -> VE:createTheme with contract overload", () => {
    const code = `${withImportAndTokens}

    export const colorModeVars = createTheme("contract", {
        color: {
            mainBg: null,
            secondaryBg: null,
            text: null,
            bg: null,
            bgSecondary: null,
            bgHover: null,
        },
    });

    export const lightThemeVars = createTheme(colorModeVars, {
        color: {
            mainBg: primary["200"],
            secondaryBg: primary["300"],
            text: primary["400"],
            bg: primary["600"],
            bgSecondary: primary["400"],
            bgHover: primary["100"],
        },
    });
`;
    const extracted = extractCreateTheme(project, code, "theme.ts");
    if (!extracted) {
        throw new Error("No theme extracted");
    }

    expect(extracted.css).toMatchInlineSnapshot(`
      "._1tja2sa6 {
        --color-mainBg__1tja2sa0: #95a7d8;
        --color-secondaryBg__1tja2sa1: #8297d1;
        --color-text__1tja2sa2: #6f88cb;
        --color-bg__1tja2sa3: #39539b;
        --color-bgSecondary__1tja2sa4: #6f88cb;
        --color-bgHover__1tja2sa5: #a7b6df;
      }"
    `);
    expect(extracted.content.replace(withImportAndTokens, "").trimStart()).toMatchInlineSnapshot(`
      "export const colorModeVars = {
              "color": {
                  "mainBg": "var(--color-mainBg__1tja2sa0)",
                  "secondaryBg": "var(--color-secondaryBg__1tja2sa1)",
                  "text": "var(--color-text__1tja2sa2)",
                  "bg": "var(--color-bg__1tja2sa3)",
                  "bgSecondary": "var(--color-bgSecondary__1tja2sa4)",
                  "bgHover": "var(--color-bgHover__1tja2sa5)"
              }
          } as const;

          export const lightThemeVars = "_1tja2sa6" as const;
      "
    `);
});
