import { extract, FunctionNodesMap, getBoxLiteralValue, QueryBox } from "@box-extractor/core";
import { endFileScope, setFileScope } from "@vanilla-extract/css/fileScope";
import { Project, ts } from "ts-morph";
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

    const extractedTheme = extract({ ast: theme, functions: ["defineProperties"] });
    const queryList = (extractedTheme.get("defineProperties") as FunctionNodesMap).queryList;

    const configByName = new Map<string, { query: QueryBox; config: GenericConfig }>();
    queryList.forEach((query) => {
        const from = query.fromNode();
        const declaration = from.getParentIfKindOrThrow(ts.SyntaxKind.VariableDeclaration);
        const nameNode = declaration.getNameNode();
        const name = nameNode.getText();
        configByName.set(name, { query, config: getBoxLiteralValue(query.box) as GenericConfig });
    });

    const extractedUsage = extract({ ast: usage, functions: ["tw"] });
    const tw = extractedUsage.get("tw")! as FunctionNodesMap;

    const ctx = createAdapterContext("debug");
    ctx.setAdapter();
    setFileScope(fileScope);

    const twStyles = generateStyleFromExtraction("tw", tw, configByName.get("tw")!.config);
    twStyles.toReplace.forEach((className, node) => node.replaceWithText(`"${className}"`));

    const { cssMap } = ctx.getCss();

    endFileScope();
    ctx.removeAdapter();

    // console.log(ctx.context.cssByFileScope.get(fileScope));
    console.log(cssMap.get(fileScope));
};

main();
