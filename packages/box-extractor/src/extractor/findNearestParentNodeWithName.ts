import type { VariableDeclarationList } from "ts-morph";
import { Node, ts } from "ts-morph";

import type { LiteralValue } from "./type-factory";
// eslint-disable-next-line unicorn/prefer-node-protocol -- doesnt work with preconstruct
import path from "path";

/**
 * Finds the nearest parent node with the given name from the given Node
 * @see adapted from https://github.com/wessberg/ts-evaluator/blob/25f17c06c006cdf08ca90f7748e497eba21bdc63/src/interpreter/util/node/find-nearest-parent-node-of-kind.ts#L31
 */
export function findNearestParentNodeWithName<T extends Node>(
    from: Node,
    name: string,
    visitedRoots = new WeakSet<Node>()
): T | LiteralValue | undefined {
    let result: Node | LiteralValue | undefined;

    function visit(nextNode: Node, nestingLayer = 0): boolean {
        if (visitedRoots.has(nextNode)) return false;
        visitedRoots.add(nextNode);

        if (Node.isIdentifier(nextNode)) {
            if (nextNode.getText() === name) {
                result = nextNode;
                return true;
            }
        } else if (Node.isShorthandPropertyAssignment(nextNode)) {
            return false;
        } else if (Node.isPropertyAssignment(nextNode)) {
            return false;
        } else if (Node.isImportDeclaration(nextNode)) {
            const importClause = nextNode.getImportClause();
            if (importClause != null) {
                const namespaceImport = importClause.getNamespaceImport();
                if (namespaceImport != null && visit(namespaceImport)) {
                    const moduleSpecifier = nextNode.getModuleSpecifier();
                    if (moduleSpecifier != null && Node.isLiteralLike(moduleSpecifier)) {
                        result = getImplementationFromExternalFile(name, moduleSpecifier.getLiteralText(), nextNode);
                        return true;
                    }
                } else if (importClause.getNamedBindings() != null && visit(importClause.getNamedBindings()!)) {
                    return true;
                }
            }

            return false;
        } else if (Node.isImportEqualsDeclaration(nextNode)) {
            const importName = nextNode.getNameNode();
            if (importName != null && visit(importName)) {
                const moduleReference = nextNode.getModuleReference();
                if (Node.isIdentifier(moduleReference)) {
                    result = findNearestParentNodeWithName(
                        nextNode.getParent(),
                        moduleReference.getText(),
                        visitedRoots
                    );
                    return result != null;
                } else if (Node.isQualifiedName(moduleReference)) {
                    return false;
                } else if (Node.isExternalModuleReference(moduleReference)) {
                    const moduleSpecifier = moduleReference.getExpression();
                    if (moduleSpecifier != null && Node.isLiteralLike(moduleSpecifier)) {
                        result = getImplementationFromExternalFile(name, moduleSpecifier.getLiteralText(), nextNode);
                        return true;
                    }
                }
            }

            return false;
        } else if (Node.isNamespaceImport(nextNode)) {
            if (visit(nextNode.getNameNode())) {
                const moduleSpecifier = nextNode.getParent()?.getParent()?.getModuleSpecifier();
                if (moduleSpecifier == null || !Node.isLiteralLike(moduleSpecifier)) {
                    return false;
                }

                result = getImplementationFromExternalFile(name, moduleSpecifier.getLiteralText(), nextNode);
                return true;
            }
        } else if (Node.isNamedImports(nextNode)) {
            for (const importSpecifier of nextNode.getElements()) {
                if (visit(importSpecifier)) {
                    return true;
                }
            }
        } else if (Node.isImportSpecifier(nextNode)) {
            if (visit(nextNode.getNameNode())) {
                const moduleSpecifier = nextNode.getParent()?.getParent()?.getParent()?.getModuleSpecifier();
                if (moduleSpecifier == null || !Node.isLiteralLike(moduleSpecifier)) {
                    return false;
                }

                result = getImplementationFromExternalFile(name, moduleSpecifier.getLiteralText(), nextNode);
                return true;
            }
        } else if (Node.isSourceFile(nextNode)) {
            for (const statement of nextNode.getStatements()) {
                if (visit(statement)) {
                    return true;
                }
            }
        } else if (Node.isVariableStatement(nextNode)) {
            for (const declaration of nextNode.getDeclarationList().getDeclarations()) {
                if (visit(declaration) && (isVarDeclaration(nextNode.getDeclarationList()) || nestingLayer < 1)) {
                    return true;
                }
            }
        } else if (Node.isBlock(nextNode)) {
            for (const statement of nextNode.getStatements()) {
                if (visit(statement, nestingLayer + 1)) {
                    return true;
                }
            }
        } else if (Node.hasName(nextNode) && nextNode.getNameNode() != null && visit(nextNode.getNameNode())) {
            result = nextNode;
            return true;
        }

        return false;
    }

    const suceeded = from.getFirstAncestor((nextNode): nextNode is T => visit(nextNode));
    return !suceeded ? undefined : (result as T | undefined);
}

/**
 * Returns true if the given VariableDeclarationList is declared with a 'var' keyword
 * @see adapted from https://vscode.dev/github/wessberg/ts-evaluator/blob/25f17c06c006cdf08ca90f7748e497eba21bdc63/src/interpreter/util/flags/is-var-declaration.ts#L6
 */
export function isVarDeclaration(declarationList: VariableDeclarationList): boolean {
    const flags = declarationList.getFlags();
    return flags !== ts.NodeFlags.Const && flags !== ts.NodeFlags.Let;
}

/**
 * @see adapted from https://vscode.dev/github/wessberg/ts-evaluator/blob/25f17c06c006cdf08ca90f7748e497eba21bdc63/src/interpreter/util/module/get-implementation-for-declaration-within-declaration-file.ts#L56
 */
export function getImplementationFromExternalFile(name: string, moduleSpecifier: string, node: Node): LiteralValue {
    const resolvedModuleSpecifier = getResolvedModuleName(moduleSpecifier, node);

    try {
        const module =
            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
            require(resolvedModuleSpecifier);
        return module[name] ?? module.default ?? module;
    } catch {
        return undefined;
    }
}

/**
 * @see adapted from https://vscode.dev/github/wessberg/ts-evaluator/blob/25f17c06c006cdf08ca90f7748e497eba21bdc63/src/interpreter/util/module/get-resolved-module-name.ts#L5
 */
export function getResolvedModuleName(moduleSpecifier: string, node: Node): string {
    if (!ts.isExternalModuleNameRelative(moduleSpecifier)) {
        return moduleSpecifier;
    }

    const parentPath = node.getSourceFile().getBaseName();
    return path.join(path.dirname(parentPath), moduleSpecifier);
}
