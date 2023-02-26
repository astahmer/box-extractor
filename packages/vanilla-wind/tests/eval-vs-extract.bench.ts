import { extract, ExtractedFunctionResult, getBoxLiteralValue, unwrapExpression } from "@box-extractor/core";
import esbuild from "esbuild";
import evalCode from "eval";
import fs from "node:fs";
import { Node, Project, SourceFile, ts } from "ts-morph";
import { bench, describe } from "vitest";
import type { GenericConfig } from "../src";

describe("eval-vs-extract", () => {
    const themePathBig = "/Users/astahmer/dev/alex/vite-box-extractor/examples/react-basic/src/theme.ts";
    const themePathSmall = "/Users/astahmer/dev/alex/vite-box-extractor/packages/vanilla-wind/samples/theme.ts";

    const project = new Project({
        compilerOptions: {
            jsx: ts.JsxEmit.React,
            jsxFactory: "React.createElement",
            jsxFragmentFactory: "React.Fragment",
            module: ts.ModuleKind.ESNext,
            moduleResolution: ts.ModuleResolutionKind.NodeNext,
            target: ts.ScriptTarget.ESNext,
            noUnusedParameters: false,
            declaration: false,
            noEmit: true,
            emitDeclarationOnly: false,
            allowJs: true,
            useVirtualFileSystem: true,
        },
    });

    bench("evalCode - big theme", () => {
        const content = fs.readFileSync(themePathBig, "utf8");
        const transformed = esbuild.transformSync(content, {
            platform: "node",
            loader: "ts",
            format: "cjs",
            target: "es2019",
        });
        evalCode(transformed.code, themePathBig, { process }, true) as Record<string, unknown>;
    });

    bench("extract - big theme", () => {
        const themeFile = project.addSourceFileAtPath(themePathBig);
        extractThemeConfig(themeFile);
    });

    bench("evalCode - small theme", () => {
        // const content = fs.readFileSync(themePath, "utf8");
        const transformed = esbuild.buildSync({
            entryPoints: [themePathSmall],
            platform: "node",
            write: false,
            bundle: true,
            // loader: "ts",
            format: "cjs",
            target: "es2019",
        });
        evalCode(transformed.outputFiles[0]!.text, themePathSmall, { process }, true) as Record<string, unknown>;
    });

    bench("extract  - small theme", () => {
        const themeFile = project.addSourceFileAtPath(themePathSmall);
        extractThemeConfig(themeFile);
    });
});

const extractThemeConfig = (sourceFile: SourceFile) => {
    const configByName = new Map<string, GenericConfig>();
    const extractedTheme = extract({ ast: sourceFile, functions: ["defineProperties"] });
    const queryList = (extractedTheme.get("defineProperties") as ExtractedFunctionResult).queryList;

    queryList.forEach((query) => {
        const from = query.fromNode();
        const declaration = from.getParentIfKind(ts.SyntaxKind.VariableDeclaration);
        if (!declaration) return;

        const identifier = unwrapExpression(from.getExpression());
        if (!Node.isIdentifier(identifier)) return;

        const isVanillaWind = identifier.getDefinitions().some((def) => {
            const declaration = def.getDeclarationNode();
            if (!declaration) return false;

            const sourcePath = declaration.getSourceFile().getFilePath();
            if (sourcePath.includes("vanilla-wind/dist")) return true;

            if (!Node.isImportSpecifier(declaration)) return false;

            const importedFrom = declaration.getImportDeclaration().getModuleSpecifierValue();
            return importedFrom === "@box-extractor/vanilla-wind";
        });
        if (!isVanillaWind) return;

        const nameNode = declaration.getNameNode();
        const name = nameNode.getText();
        const conf = getBoxLiteralValue(query.box) as GenericConfig;
        configByName.set(name, conf);
    });

    return configByName;
};
