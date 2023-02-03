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

it("can find usage references from a variable", () => {
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
    const extracted = extractFunctionFrom(sourceFile, "createTheme");
    const sprinklesFn = extracted.get("sprinklesFn")!;

    // expect(sprinklesFn.nameNode().getText()).toMatchInlineSnapshot();
    // expect(sprinklesFn.queryBox.fromNode().getText()).toMatchInlineSnapshot();
    // expect(sprinklesFn.queryBox.getNode().getText()).toMatchInlineSnapshot();
});
