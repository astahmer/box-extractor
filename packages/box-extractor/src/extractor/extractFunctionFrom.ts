import { BindingName, Identifier, Node, SourceFile, ts } from "ts-morph";

import { createLogger } from "@box-extractor/logger";
import { extract } from "./extract";
import { getBoxLiteralValue } from "./getBoxLiteralValue";
import type { BoxNodeMap } from "./type-factory";
import type { FunctionNodesMap } from "./types";
import { unwrapExpression } from "./utils";

const logger = createLogger("box-ex:extract-function-from");

export const isImportedFrom = (
    identifier: Identifier,
    importName: string,
    canImportSourcePath?: (sourcePath: string) => boolean
) => {
    return identifier.getDefinitions().some((def) => {
        const declaration = def.getDeclarationNode();
        if (!declaration) return false;

        const sourcePath = declaration.getSourceFile().getFilePath().toString();
        logger.scoped("imported-from", { kind: declaration.getKindName(), sourcePath });
        if (canImportSourcePath?.(sourcePath)) return true;

        if (!Node.isImportSpecifier(declaration)) return false;

        const importedFrom = declaration.getImportDeclaration().getModuleSpecifierValue();
        return importedFrom === importName;
    });
};

export const extractFunctionFrom = <Result>(
    sourceFile: SourceFile,
    functionName: string,
    importName?: string,
    canImportSourcePath?: (sourcePath: string) => boolean
) => {
    const resultByName = new Map<string, { result: Result; queryBox: BoxNodeMap; nameNode: () => BindingName }>();
    const extractedTheme = extract({ ast: sourceFile, functions: [functionName] });
    const queryList = (extractedTheme.get(functionName) as FunctionNodesMap).queryList;
    const from = sourceFile.getFilePath().toString();
    logger({ from, queryList: queryList.length });

    queryList.forEach((query) => {
        const fromNode = query.fromNode();
        const declaration = fromNode.getParentIfKind(ts.SyntaxKind.VariableDeclaration);
        if (!declaration) return;

        const identifier = unwrapExpression(fromNode.getExpression());
        if (!Node.isIdentifier(identifier)) return;

        const isImportedFromValid = importName ? isImportedFrom(identifier, importName, canImportSourcePath) : true;
        logger({ isImportedFromValid });
        if (!isImportedFromValid) return;

        const nameNode = declaration.getNameNode();
        const name = nameNode.getText();
        // TODO replace getBoxLiteralValue with specific treatment
        const result = getBoxLiteralValue(query.box) as Result;
        resultByName.set(name, { result, queryBox: query.box, nameNode: () => nameNode });

        logger({ name });
    });

    return resultByName;
};
