import { createLogger } from "@box-extractor/logger";
import { Identifier, Node } from "ts-morph";
// eslint-disable-next-line import/no-cycle
import { getExportedVarDeclarationWithName, getModuleSpecifierSourceFile } from "./maybeBoxNode";
import type { BoxContext } from "./types";

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

export function getDeclarationFor(node: Identifier, stack: Node[], ctx: BoxContext) {
    const parent = node.getParent();
    if (!parent) {
        return;
    }

    const declarationStack = [] as Node[];

    let declaration;
    if (
        (Node.isVariableDeclaration(parent) ||
            Node.isParameterDeclaration(parent) ||
            Node.isFunctionDeclaration(parent) ||
            Node.isBindingElement(parent)) &&
        parent.getNameNode() == node
    ) {
        logger.scoped("getDeclarationFor", { isDeclarationLike: true, kind: parent.getKindName() });
        declarationStack.push(parent);
        declaration = parent;
    } else if (Node.isImportSpecifier(parent) && parent.getNameNode() == node) {
        if (ctx.flags?.skipTraverseFiles) return;

        const sourceFile = getModuleSpecifierSourceFile(parent.getImportDeclaration());
        logger.scoped("getDeclarationFor", { isImportDeclaration: true, sourceFile: Boolean(sourceFile) });

        if (sourceFile) {
            const exportStack = [parent, sourceFile] as Node[];
            const maybeVar = getExportedVarDeclarationWithName(node.getText(), sourceFile, exportStack, ctx);

            logger.scoped("getDeclarationFor", {
                from: sourceFile.getFilePath(),
                hasVar: Boolean(maybeVar),
                // maybeVar: maybeVar?.getText(),
            });

            if (maybeVar) {
                declarationStack.push(...exportStack.concat(maybeVar));
                declaration = maybeVar;
            }
        }
    }

    logger.scoped("getDeclarationFor", {
        node: node.getKindName(),
        parent: parent.getKindName(),
        declaration: declaration?.getKindName(),
    });

    if (declaration) {
        stack.push(...declarationStack);
    }

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

export function findIdentifierValueDeclaration(
    identifier: Identifier,
    stack: Node[],
    ctx: BoxContext,
    visitedsWithStack: WeakMap<Node, Node[]> = new Map()
): ReturnType<typeof getDeclarationFor> | undefined {
    let scope = identifier as Node | undefined;
    let foundNode: ReturnType<typeof getDeclarationFor> | undefined;
    let isUnresolvable = false;
    let count = 0;
    const innerStack = [] as Node[];

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
            if (visitedsWithStack.has(node)) {
                traversal.skip();
                innerStack.push(...visitedsWithStack.get(node)!);
                return;
            }

            if (node == identifier) return;
            visitedsWithStack.set(node, innerStack);

            if (Node.isIdentifier(node) && node.getText() == refName) {
                const declarationStack = [node] as Node[];
                const maybeDeclaration = getDeclarationFor(node, declarationStack, ctx);
                if (maybeDeclaration) {
                    if (Node.isParameterDeclaration(maybeDeclaration)) {
                        const initializer = maybeDeclaration.getInitializer();
                        const typeNode = maybeDeclaration.getTypeNode();
                        if (initializer) {
                            innerStack.push(...declarationStack.concat(initializer));
                            foundNode = maybeDeclaration;
                        } else if (typeNode && Node.isTypeLiteral(typeNode)) {
                            innerStack.push(...declarationStack.concat(typeNode));
                            foundNode = maybeDeclaration;
                        } else {
                            isUnresolvable = true;
                        }

                        traversal.stop();
                        return;
                    }

                    innerStack.push(...declarationStack);
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
            if (foundNode) {
                stack.push(...innerStack);
            }

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
