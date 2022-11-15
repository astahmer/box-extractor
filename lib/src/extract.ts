import { tsquery } from "@phenomnomnominal/tsquery";
import {
    ConditionalExpression,
    ElementAccessExpression,
    Identifier,
    ObjectLiteralExpression,
    PropertyAccessExpression,
    PropertyAssignment,
    SourceFile,
    TemplateExpression,
    ts,
    Type,
} from "ts-morph";
import { Node } from "ts-morph";

// const ast = tsquery.ast(code, "", ScriptKind.TSX);

type Nullable<T> = T | null | undefined;

const isNotNullish = <T>(element: Nullable<T>): element is T => element != null;

export const extract = (
    ast: SourceFile,
    config: {
        componentName: string;
        propNameList: string[];
    }
) => {
    const propIdentifier = `Identifier[name=/${config.propNameList.join("|")}/]`;
    const selector = `JsxElement:has(Identifier[name="${config.componentName}"]) JsxAttribute > ${propIdentifier}`;
    // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
    //           ^^^^^           ^^^^^^^^^^^^^^^

    // console.log(selector);
    const identifierNodesFromJsxAttribute = query<Identifier>(ast, selector);
    if (identifierNodesFromJsxAttribute.length > 0) {
        const values = identifierNodesFromJsxAttribute.map((n) => [n.getText(), extractJsxAttributeIdentifierValue(n)]);

        // console.log(identifierNodesFromJsxAttribute.length);
        console.log(
            identifierNodesFromJsxAttribute
                .map((n) => [n.getParent().getText(), extractJsxAttributeIdentifierValue(n)])
                .filter((v) => !v[v.length - 1])
        );

        return values;
    }
};

const parseType = (type: Type) => {
    const text = type.getText().replace(/["']/g, "").split(" | ");
    return text.length > 1 ? text : text[0];
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
        const expression = unwrapExpression(initializer.getExpressionOrThrow());
        if (!expression) return;

        // console.log("expr", expression.getKindName(), expression.getText());

        // const type = expression.getType();
        // if (type.isLiteral() || type.isUnionOrIntersection()) return parseType(type);

        // <ColorBox color={"xxx"} />
        if (Node.isStringLiteral(expression)) {
            return expression.getLiteralText();
        }

        // <ColorBox color={staticColor} />
        if (Node.isIdentifier(expression)) {
            return getIdentifierReferenceValue(expression);
        }

        // <ColorBox color={isDark ? darkValue : "whiteAlpha.100"} />
        if (Node.isConditionalExpression(expression)) {
            return [maybeLiteral(expression.getWhenTrue()), maybeLiteral(expression.getWhenFalse())];
        }

        // <ColorBox color={xxx[yyy]} /> / <ColorBox color={xxx["zzz"]} />
        if (Node.isElementAccessExpression(expression)) {
            return getElementAccessedExpressionValue(expression);
        }

        // <ColorBox color={xxx.yyy} />
        if (Node.isPropertyAccessExpression(expression)) {
            return getPropertyAccessedExpressionValue(expression);
        }

        // if (Node.isBinaryExpression(expression)) {
        //     const left = getLiteralOrIdentifierValue(expression.getLeft());
        //     const right = getLiteralOrIdentifierValue(expression.getRight());
        //     console.log({ left, right });
        //     return [left, right];
        // }
    }
};

const getPropValue = (initializer: ObjectLiteralExpression, propName: string) => {
    const property = initializer.getProperty(propName);
    // console.log(
    //     "props",
    //     { propName },
    //     properties.map((p) => p.getText())
    // );

    if (Node.isPropertyAssignment(property)) {
        const propInit = property.getInitializerOrThrow();
        const maybePropValue = maybeLiteral(propInit);

        if (maybePropValue) {
            return maybePropValue;
        }
    }
};

const maybeTemplateStringValue = (template: TemplateExpression) => {
    const head = template.getHead();
    const tail = template.getTemplateSpans();

    const headValue = maybeLiteral(head);
    const tailValues = tail.map((t) => maybeLiteral(t.getExpression()));
    // console.log(head.getKindName(), head.getLiteralText(), { headValue, tailValues });

    if (isNotNullish(headValue) && tailValues.every(isNotNullish)) {
        const propName = headValue + tailValues.join("");
        // console.log({ propName, headValue, tailValues });
        return propName;
    }
};

const maybePropIdentifierDefinitionValue = (elementAccessed: Identifier, propName: string) => {
    const def = elementAccessed.getDefinitionNodes()[0];

    if (Node.isVariableDeclaration(def)) {
        const initializer = unwrapExpression(def.getInitializerOrThrow());
        // console.log("nno", initializer.getKindName(), initializer.getText());

        if (Node.isObjectLiteralExpression(initializer)) {
            return getPropValue(initializer, propName);
        }
    }
};

const maybeLiteral = (node: Node): string | undefined => {
    if (Node.isStringLiteral(node)) {
        return node.getLiteralText();
    }

    if (Node.isIdentifier(node)) {
        return getIdentifierReferenceValue(node);
    }

    if (Node.isTemplateHead(node)) {
        return node.getLiteralText();
    }

    // console.log(node.getKindName(), node.getText());
    if (Node.isTemplateExpression(node)) {
        return maybeTemplateStringValue(node);
    }

    if (Node.isElementAccessExpression(node)) {
        return getElementAccessedExpressionValue(node) as string;
    }

    if (Node.isPropertyAccessExpression(node)) {
        return getPropertyAccessedExpressionValue(node)!;
    }
};

const unwrapExpression = (node: Node): Node => {
    if (Node.isAsExpression(node)) {
        return unwrapExpression(node.getExpression());
    }

    if (Node.isParenthesizedExpression(node)) {
        return unwrapExpression(node.getExpression());
    }

    if (Node.isNonNullExpression(node)) {
        return unwrapExpression(node.getExpression());
    }

    if (Node.isTypeAssertion(node)) {
        return unwrapExpression(node.getExpression());
    }

    return node;
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

const getElementAccessedExpressionValue = (expression: ElementAccessExpression): string | Array<string> | undefined => {
    const type = expression.getType();
    if (type.isLiteral() || type.isUnionOrIntersection()) return parseType(type);

    const elementAccessed = expression.getExpression();
    const arg = unwrapExpression(expression.getArgumentExpressionOrThrow());
    // console.log("yes", {
    //     arg: arg.getText(),
    //     argKind: arg.getKindName(),
    //     elementAccessed: elementAccessed.getText(),
    //     elementAccessedKind: elementAccessed.getKindName(),
    //     expression: expression.getText(),
    //     expressionKind: expression.getKindName(),
    // });

    // <ColorBox color={xxx[yyy + "zzz"]} />
    if (Node.isBinaryExpression(arg) && arg.getOperatorToken().getKind() === ts.SyntaxKind.PlusToken) {
        const left = unwrapExpression(arg.getLeft());
        const right = unwrapExpression(arg.getRight());

        const leftValue = maybeLiteral(left);
        const rightValue = maybeLiteral(right);

        // console.log({
        //     leftValue,
        //     rightValue,
        //     left: [left.getKindName(), left.getText()],
        //     right: [right.getKindName(), right.getText()],
        // });

        if (isNotNullish(leftValue) && isNotNullish(rightValue)) {
            const propName = leftValue + rightValue;
            // console.log(propName, elementAccessed.getText());

            if (isNotNullish(propName) && Node.isIdentifier(elementAccessed)) {
                return maybePropIdentifierDefinitionValue(elementAccessed, propName);
            }
        }
    }

    // <ColorBox color={xxx[`yyy`]} />
    if (Node.isTemplateExpression(arg)) {
        const propName = maybeTemplateStringValue(arg);
        // console.log({ propName });

        if (isNotNullish(propName) && Node.isIdentifier(elementAccessed)) {
            return maybePropIdentifierDefinitionValue(elementAccessed, propName);
        }
    }

    // <ColorBox color={{ staticColor: "facebook.900" }["staticColor"]}></ColorBox>
    if (Node.isObjectLiteralExpression(elementAccessed)) {
        const propName = maybeLiteral(arg);

        if (isNotNullish(propName)) {
            return getPropValue(elementAccessed, propName);
        }
    }

    // last child is always a close bracket
    // const beforeClosingBracketNode = expression.getChildAtIndex(expression.getChildCount() - 2);
    // const value = getLiteralOrIdentifierValue(beforeClosingBracketNode);
    // console.log(expression.getType().getText(), expression.getText());
    // console.log(expression.getExpression().getType().getText());
    // if (value) return value;

    // if (Node.isIdentifier(node)) {
    //     return getIdentifierReferenceValue(node);
    // }
    // console.log(expression.getLastChildByKind)

    // return getIdentifierReferenceValue(expression.getExpression());
};

const getPropertyAccessedExpressionValue = (expression: PropertyAccessExpression): string | undefined => {
    const type = expression.getType();
    if (type.isLiteral() || type.isUnionOrIntersection()) return parseType(type) as string;

    const propName = expression.getName();
    const elementAccessed = expression.getExpression();

    if (Node.isIdentifier(elementAccessed)) {
        return maybePropIdentifierDefinitionValue(elementAccessed, propName);
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

// const initializer = def.getInitializerIfKindOrThrow(ts.SyntaxKind.StringLiteral);

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
