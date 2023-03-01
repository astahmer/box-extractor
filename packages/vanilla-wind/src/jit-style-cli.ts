import { extract, ExtractedFunctionResult, getBoxLiteralValue, ExtractedFunctionInstance } from "@box-extractor/core";
import { endFileScope, setFileScope } from "@vanilla-extract/css/fileScope";
import { CallExpression, Project, ts } from "ts-morph";
import type { GenericConfig } from "./defineProperties";
import { generateStyleFromExtraction } from "./generateStyleFromExtraction";
import { createAdapterContext } from "./jit-style";

const fileScope = "jit-style-cli.ts";
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
            emitDeclarationOnly: false,
            // allowJs: true,
            // useVirtualFileSystem: true,
        },
        skipAddingFilesFromTsConfig: true,
        skipFileDependencyResolution: true,
        skipLoadingLibFiles: true,
    });
};

const project = createProject();

const themePath = "samples/theme.ts";
const usagePath = "samples/usage.ts";

export const main = () => {
    // const theme = project.addSourceFileAtPath(themePath);
    const sources = project.addSourceFilesAtPaths([themePath, usagePath]);
    const theme = sources[0]!;
    const usage = sources[1]!;

    const extractedTheme = extract({
        ast: theme,
        functions: {
            matchFn: ({ fnName }) => fnName === "defineProperties",
            matchProp: () => true,
            matchArg: () => true,
        },
    });
    const queryList = (extractedTheme.get("defineProperties") as ExtractedFunctionResult).queryList;

    const configByName = new Map<string, { query: ExtractedFunctionInstance; config: GenericConfig }>();
    queryList.forEach((query) => {
        const from = query.box.getNode() as CallExpression;
        const declaration = from.getParentIfKindOrThrow(ts.SyntaxKind.VariableDeclaration);
        const nameNode = declaration.getNameNode();
        const name = nameNode.getText();
        configByName.set(name, { query, config: getBoxLiteralValue(query.box) as GenericConfig });
    });

    const extractedUsage = extract({
        ast: usage,
        functions: { matchFn: ({ fnName }) => fnName === "tw", matchProp: () => true, matchArg: () => true },
    });

    const ctx = createAdapterContext("debug");
    ctx.setAdapter();
    setFileScope(fileScope);

    const twStyles = generateStyleFromExtraction({
        name: "tw",
        extracted: extractedUsage.get("tw")! as ExtractedFunctionResult,
        config: configByName.get("tw")!.config,
    });
    twStyles.toReplace.forEach((className, node) => node.replaceWithText(`"${className}"`));

    const { cssMap } = ctx.getCss();

    endFileScope();
    ctx.removeAdapter();

    // console.log(ctx.context.cssByFileScope.get(fileScope));
    console.log(cssMap.get(fileScope));
};

main();
