import { createLogger } from "@box-extractor/logger";
import { Identifier, Node, ts } from "ts-morph";
// eslint-disable-next-line import/no-cycle
import { getExportedVarDeclarationWithName, getModuleSpecifierSourceFile } from "./maybeBoxNode";

const logger = createLogger("box-extractor:extractor:findIdentifierValueDeclaration");

// adapted from https://github.com/dsherret/ts-morph/issues/1351

export function isScope(node: Node): boolean {
    return (
        // Node.isBlock(node) ||
        Node.isFunctionDeclaration(node) ||
        Node.isFunctionExpression(node) ||
        Node.isArrowFunction(node) ||
        Node.isSourceFile(node)
        // TODO more?
    );
}

export function getDeclarationFor(node: Identifier) {
    const parent = node.getParent();
    if (!parent) {
        return;
    }

    let declaration;
    if (
        (parent.isKind(ts.SyntaxKind.VariableDeclaration) ||
            parent.isKind(ts.SyntaxKind.Parameter) ||
            parent.isKind(ts.SyntaxKind.BindingElement)) &&
        parent.getNameNode() == node
    ) {
        logger.scoped("getDeclarationFor", { isDeclarationLike: true, kind: parent.getKindName() });
        declaration = parent;
    }

    if (Node.isImportSpecifier(parent) && parent.getNameNode() == node) {
        const sourceFile = getModuleSpecifierSourceFile(parent.getImportDeclaration());
        logger.scoped("getDeclarationFor", { isImportDeclaration: true, sourceFile: Boolean(sourceFile) });

        if (sourceFile) {
            const maybeVar = getExportedVarDeclarationWithName(node.getText(), sourceFile);

            logger.scoped("getDeclarationFor", {
                from: sourceFile.getFilePath(),
                hasVar: Boolean(maybeVar),
                // maybeVar: maybeVar?.getText(),
            });

            if (maybeVar) {
                declaration = maybeVar;
            }
        }
    }

    logger.scoped("getDeclarationFor", {
        node: node.getKindName(),
        parent: parent.getKindName(),
        declaration: declaration?.getKindName(),
    });

    // console.log({ found: node.getText(), parent: parent.getKindName() });
    return declaration;
}

// TODO getParentWhile ?
const getInnermostScope = (from: Node) => {
    let scope = from.getParent();
    while (scope && !isScope(scope)) {
        // logger.scoped("getInnermostScope", scope.getKindName());
        scope = scope.getParent();
    }

    logger.scoped("getInnermostScope", { found: scope?.getKindName() });
    return scope;
};

// TODO stack push ?
export function findIdentifierValueDeclaration(
    identifier: Identifier,
    visiteds: WeakSet<Node> = new Set()
): Node | undefined {
    let scope = identifier as Node | undefined;
    let foundNode: Node | undefined;
    let isUnresolvable = false;
    let count = 0;

    do {
        scope = getInnermostScope(scope!);
        logger.scoped("find", {
            identifier: identifier.getText(),
            scope: scope?.getKindName(),
            count: count++,
        });
        if (!scope) return;

        const refName = identifier.getText();
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        scope.forEachDescendant((node, traversal) => {
            // logger.scoped("find", node.getKindName());
            if (visiteds.has(node)) {
                traversal.skip();
                return;
            }

            // TODO reverse ?
            visiteds.add(node);
            if (node == identifier) return;

            if (Node.isIdentifier(node) && node.getText() == refName) {
                const maybeDeclaration = getDeclarationFor(node);
                if (maybeDeclaration) {
                    if (Node.isParameterDeclaration(maybeDeclaration)) {
                        const typeNode = maybeDeclaration.getTypeNode();
                        if (maybeDeclaration.getInitializer()) {
                            foundNode = maybeDeclaration;
                        } else if (typeNode && Node.isTypeLiteral(typeNode)) {
                            foundNode = maybeDeclaration;
                        } else {
                            isUnresolvable = true;
                        }

                        traversal.stop();
                        return;
                    }

                    foundNode = maybeDeclaration;
                    traversal.stop();
                }
            }
        });

        logger.scoped("find", {
            scope: scope.getKindName(),
            foundNode: foundNode?.getKindName(),
            isUnresolvable,
        });
        if (foundNode || isUnresolvable) {
            return foundNode;
        }
    } while (scope && !Node.isSourceFile(scope) && !foundNode && !isUnresolvable && count < 100);

    logger.scoped("find", {
        end: true,
        count,
        scope: scope?.getKindName(),
        isUnresolvable,
    });
}
