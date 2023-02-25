import { BoxNodeList, extractFunctionFrom, unbox } from "@box-extractor/core";
import { createLogger } from "@box-extractor/logger";
import { createGlobalTheme, createTheme, createThemeContract } from "@vanilla-extract/css";
import { endFileScope, setFileScope } from "@vanilla-extract/css/fileScope";
import { Node, Project, ts } from "ts-morph";
import { match } from "ts-pattern";
import type { Contract, MapLeafNodes } from "./createTheme";
import { createAdapterContext } from "./jit";
import { normalizeTsx, virtualExtCss } from "./utils";

const logger = createLogger("box-ex:vanilla-wind:create-theme");

type CreateThemeKind =
    | "createTheme-basic"
    | "createTheme-using-contract"
    | "createThemeContract"
    // | "createGlobalThemeContract"
    | "createGlobalTheme-basic"
    | "createGlobalTheme-using-contract";

type CreateThemeArguments = {
    kind: CreateThemeKind;
    selector?: string;
    tokens?: MapLeafNodes<Contract, string>;
    contract?: Contract;
    boxNode: BoxNodeList;
};

const getTheme = (boxNode: BoxNodeList) => {
    if (boxNode.value.length === 0) return null;

    const _arg1 = unbox(boxNode.value[0]);
    const _arg2 = unbox(boxNode.value[1]);
    const _arg3 = unbox(boxNode.value[2]);

    // createThemeContract / createGlobalThemeContract
    if (_arg1 === "contract") {
        // createGlobalThemeContract
        if (typeof _arg2 === "string") {
            return null;
            // return { boxNode, kind: "createGlobalThemeContract", selector: _arg1, contract: _arg3 };
        }

        // createThemeContract
        return { boxNode, kind: "createThemeContract", contract: _arg2 };
    }

    // createGlobalTheme
    if (typeof _arg1 === "string") {
        // createGlobalTheme from another theme contract
        if (_arg3) {
            return {
                kind: "createGlobalTheme-using-contract",
                selector: _arg1,
                contract: _arg2,
                tokens: _arg3,
            };
        }

        // createGlobalTheme basic
        return { boxNode, kind: "createGlobalTheme-basic", selector: _arg1, tokens: _arg2 };
    }

    // createTheme from another theme contract
    if (typeof _arg2 === "object") {
        return { boxNode, kind: "createTheme-using-contract", contract: _arg1, tokens: _arg2 };
    }

    // createTheme basic
    return { boxNode, kind: "createTheme-basic", contract: _arg1, tokens: _arg2 };
};

export const extractCreateTheme = (project: Project, code: string, validId: string) => {
    // console.log("extractCreateTheme", { validId });
    // avoid full AST-parsing if possible
    if (!code.includes("createTheme(")) {
        return null;
    }

    const sourceFile = project.createSourceFile(normalizeTsx(validId), code, {
        overwrite: true,
        scriptKind: ts.ScriptKind.TSX,
    });

    logger("create-theme", "scanning", { validId });

    const extracted = extractFunctionFrom<CreateThemeArguments | null>(sourceFile, "createTheme", (boxNode) => {
        logger.scoped("get-result", boxNode);

        return getTheme(boxNode) as CreateThemeArguments | null;
    });
    if (extracted.size === 0) return null;

    const it = extracted.values();
    let result = it.next();
    let hasExtract = false;
    while (!result.done) {
        if (result.value.result) {
            hasExtract = true;
            break;
        }

        result = it.next();
    }

    if (!hasExtract) return null;

    const absoluteId = validId + virtualExtCss;
    const ctx = createAdapterContext("debug");
    ctx.setAdapter();
    setFileScope(validId);

    const toReplace = new Map<Node, string>();
    const themeByName = new Map<string, ReturnType<typeof createThemeByKind>>();
    extracted.forEach((extract, name) => {
        if (!extract.result) return null;

        const fromNode = extract.queryBox.getNode();
        if (!extract.result.contract) {
            let name: string | undefined;
            if (extract.result.kind === "createTheme-using-contract") {
                name = extract.result.boxNode.value[0]?.getNode().getText();
            } else if (extract.result.kind === "createGlobalTheme-using-contract") {
                name = name = extract.result.boxNode.value[1]?.getNode().getText();
            }

            if (name) {
                const prevResult = themeByName.get(name);
                // console.log({ name, prevResult, themeByName });
                if (prevResult) {
                    extract.result.contract = prevResult as Contract;
                }
            }
        }

        const theme = createThemeByKind(extract.result as any);
        themeByName.set(name, theme);
        // console.log({ name, theme });

        toReplace.set(fromNode, `${JSON.stringify(theme, null, 4)} as const`);
        logger({ name, theme });
    });

    toReplace.forEach((value, node) => {
        if (node.wasForgotten()) return null;
        node.replaceWithText(value);
    });

    const importStatement = `import "${absoluteId}";\n`;
    const content = sourceFile.getFullText();
    const updated = importStatement + content;

    const styles = ctx.getCss();
    const css = styles.cssMap.get(validId)!;

    endFileScope();
    ctx.removeAdapter();

    return { updated, content, importStatement, css, absoluteId, themeByName };
};

const createThemeByKind = (args: CreateThemeArguments) => {
    return (
        match(args.kind)
            .with("createTheme-basic", () => {
                return createTheme(args.contract!, args.tokens!);
            })
            .with("createTheme-using-contract", () => {
                return createTheme(args.contract!, args.tokens!);
            })
            .with("createThemeContract", () => {
                return createThemeContract(args.contract!);
            })
            // .with("createGlobalThemeContract", () => {
            //     return createGlobalThemeContract(args.selector!, args.contract!);
            // })
            .with("createGlobalTheme-basic", () => {
                return createGlobalTheme(args.selector!, args.tokens!);
            })
            .with("createGlobalTheme-using-contract", () => {
                return void createGlobalTheme(args.selector!, args.contract!, args.tokens!);
            })
            .exhaustive()
    );
};
