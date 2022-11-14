import { tsquery } from "@phenomnomnominal/tsquery";
import type { ConditionalExpression, Identifier, SourceFile } from "ts-morph";
import { Node } from "ts-morph";

// const ast = tsquery.ast(code, "", ScriptKind.TSX);

export const extract = (ast: SourceFile) => {
    const componentName = "ColorBox";
    const propNameList = ["color", "backgroundColor"];

    const propIdentifier = `Identifier[name=/${propNameList.join("|")}/]`;
    const selector = `JsxElement:has(Identifier[name="${componentName}"]) JsxAttribute > ${propIdentifier}`;
    // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
    //           ^^^^^           ^^^^^^^^^^^^^^^

    console.log(selector);
    const nodes = query<Identifier>(ast, selector);
    if (nodes.length > 0) {
        console.log(
            nodes.length,
            nodes.map((n) => extractJsxAttributeIdentifierValue(n))
        );
    }
};

const extractJsxAttributeIdentifierValue = (identifier: Identifier) => {
    // console.log(n.getText(), n.parent.getText());
    const parent = identifier.getParent();
    if (!Node.isJsxAttribute(parent)) return;
    // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
    //           ^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // identifier = `color` (and then backgroundColor)
    // parent = `color="red.200"` (and then backgroundColor="blackAlpha.100")

    const initializer = parent.getInitializer();
    if (!initializer) return;

    if (Node.isStringLiteral(initializer)) {
        // initializer = `"red.200"` (and then "blackAlpha.100")

        return initializer.getLiteralText();
    }

    // <ColorBox color={xxx} />
    if (Node.isJsxExpression(initializer)) {
        const expression = initializer.getExpression();

        // <ColorBox color={"xxx"} />
        if (Node.isStringLiteral(expression)) {
            return expression.getLiteralText();
        }

        // <ColorBox color={staticColor} />
        if (Node.isIdentifier(expression)) {
            return getIdentifierReferenceValue(expression);
            // return unwrapIdentifierValue(ast, expression);
        }

        // <ColorBox color={isDark ? darkValue : "whiteAlpha.100"} />
        if (Node.isConditionalExpression(expression)) {
            return [
                getLiteralOrIdentifierValue(expression.getWhenTrue()),
                getLiteralOrIdentifierValue(expression.getWhenFalse()),
            ];
        }

        // <ColorBox color={[xxx]} />
        if (Node.isElementAccessExpression(expression)) {
            // const lastChild = expression.getChildAtIndex(expression.getChildCount() - 1);
            // console.log(
            //     {
            //         full: expression.getText(),
            //         text: expression.getChildAtIndex(expression.getChildCount() - 2).getText(),
            //     },
            //     expression.getChildren().map((n) => [n.getKindName(), n.getText()])
            // );

            // last child is always a close bracket
            const node = expression.getChildAtIndex(expression.getChildCount() - 2);
            const value = getLiteralOrIdentifierValue(node);
            // if (Node.isIdentifier(node)) {
            //     return getIdentifierReferenceValue(node);
            // }
            // console.log(expression.getLastChildByKind)

            // return getIdentifierReferenceValue(expression.getExpression());
        }
    }
};

const getLiteralOrIdentifierValue = (node: Node) => {
    if (Node.isStringLiteral(node)) {
        return node.getLiteralText();
    }

    if (Node.isIdentifier(node)) {
        return getIdentifierReferenceValue(node);
    }
};

const getIdentifierReferenceValue = (identifier: Identifier) => {
    const def = identifier.getDefinitionNodes()[0];

    // const staticColor =
    if (Node.isVariableDeclaration(def)) {
        const initializer = def.getInitializerOrThrow();

        // const staticColor = "gray.100" ;
        if (Node.isStringLiteral(initializer)) {
            return initializer.getLiteralText();
        }

        // const staticColor = "gray.100" as any;
        if (Node.isAsExpression(initializer)) {
            const expression = initializer.getExpression();
            if (Node.isStringLiteral(expression)) {
                return expression.getLiteralText();
            }
        }
    }
};

// https://gist.github.com/dsherret/826fe77613be22676778b8c4ba7390e7
function query<T extends Node = Node>(node: Node, q: string): T[] {
    return tsquery(node.compilerNode as any, q).map((n) => (node as any)._getNodeFromCompilerNode(n) as T);
}

function queryOne<T extends Node = Node>(node: Node, q: string): T | undefined {
    const results = query<T>(node, q);
    return results.length > 0 ? results[0] : undefined;
}

// const children = initializer.getChildren();
// if (children.length === 1) {
//     const child = children[0];
//     if (MorphNode.isIdentifier(child)) {
//         return child.getText();
//     }
// }

// const initializer = def.getInitializerIfKindOrThrow(ts.SyntaxKind.StringLiteral);

// ReturnType<JsxAttribute["getInitializer"]>
const unwrapIdentifierValue = (sourceFile: SourceFile, identifier: Identifier) => {
    const values = [];
    const name = identifier.getText();
    console.log({ name });

    const declarationIdentifier = queryOne<Identifier>(sourceFile, `VariableDeclaration > Identifier[name=${name}]`);

    // const staticColor =
    if (declarationIdentifier) {
        const parent = declarationIdentifier.getParent();
        if (!parent) return;

        if (Node.isVariableDeclaration(parent)) {
            const initializer = parent.getInitializer();
            if (!initializer) return;

            // const staticColor = "gray.100" ;
            if (Node.isStringLiteral(initializer)) {
                return initializer.getLiteralText();
            }

            // const staticColor = "gray.100" as any;
            if (Node.isAsExpression(initializer)) {
                const expression = initializer.getExpression();
                if (Node.isStringLiteral(expression)) {
                    return expression.getLiteralText();
                }
            }
        }

        console.log(["declarationIdentifier", parent.getText(), declarationIdentifier.getText()]);
    }

    console.log("missing", { name, initializer: identifier.getText() });
};

const unwrapConditionalExpression = (sourceFile: SourceFile, expression: ConditionalExpression) => {
    const whenTrue = expression.getWhenTrue();
    if (Node.isIdentifier(whenTrue)) {
        unwrapIdentifierValue(sourceFile, whenTrue);
    }

    const whenFalse = expression.getWhenFalse();
    if (Node.isIdentifier(whenFalse)) {
        unwrapIdentifierValue(sourceFile, whenFalse);
    }
};

// const propAssignment = queryOne<Identifier>(
//     sourceFile,
//     `PropertyAssignment > Identifier[name=${name}], PropertyAssignment > ComputedPropertyName > Identifier[name=${name}]`
// );

// if (propAssignment) {
//     const parent = propAssignment.getParent();
//     if (MorphNode.isPropertyAssignment(parent)) {
//         const initializer = parent.getInitializer();
//         if (initializer && MorphNode.isStringLiteral(initializer)) {
//             return initializer.getLiteralText();
//         }

//         console.log(["propAssignment", parent.getText(), propAssignment.getText()]);
//     }
// }

// queryOne(sourceFile, parent.getText());

// return initializer.expression.text;

// console.log(console.log(ast.forEachChild((c) => tsquery.syntaxKindName(c.kind))));
//     console.log({ id });
//     console.log(nodes.map((n) => tsquery.syntaxKindName(parent.kind)));
//     // console.log(code);

// if (ts.isConditionalExpression(initializer)) {
//     if (ts.isStringLiteral(initializer.whenTrue)) {
//         return initializer.whenTrue.text;
//     }
// }
// if (ts.isPropertyAccessExpression(initializer)) {
//     const lastChild = initializer.getChildAt(initializer.getChildCount() - 1);
//     if (ts.isIdentifier(lastChild)) {
//         return lastChild.text;
//     }
// }
// if (ts.isElementAccessExpression(initializer)) {
//     const lastChild = initializer.getChildAt(initializer.getChildCount() - 1);
//     if (ts.isStringLiteral(lastChild)) {
//         return lastChild.text;
//     }
// }
// if (ts.isCallExpression(initializer)) {
//     const lastChild = initializer.getChildAt(initializer.getChildCount() - 1);
//     if (ts.isIdentifier(lastChild)) {
//         return lastChild.text;
//     }
// }
// if (ts.isBinaryExpression(initializer)) {
//     const lastChild = initializer.getChildAt(initializer.getChildCount() - 1);
//     if (ts.isIdentifier(lastChild)) {
//         return lastChild.text;
//     }
// }
// if (ts.isObjectLiteralExpression(initializer)) {
//     const lastChild = initializer.getChildAt(initializer.getChildCount() - 1);
//     if (ts.isPropertyAssignment(lastChild)) {
//         const name = lastChild.getChildAt(0);
//         if (ts.isIdentifier(name)) {
//             return name.text;
//         }
//     }
// }
// if (ts.isConditionalExpression(initializer)) {
//     const lastChild = initializer.getChildAt(initializer.getChildCount() - 1);
//     if (ts.isIdentifier(lastChild)) {
//         return lastChild.text;
//     }
// }
