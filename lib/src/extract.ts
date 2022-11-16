import { tsquery } from "@phenomnomnominal/tsquery";
import {
    ArrayLiteralExpression,
    ConditionalExpression,
    ElementAccessExpression,
    Identifier,
    ObjectLiteralElementLike,
    ObjectLiteralExpression,
    PropertyAccessExpression,
    PropertyAssignment,
    SourceFile,
    TemplateExpression,
    ts,
    Type,
    Node,
    Expression,
    TypeChecker,
    BinaryExpression,
} from "ts-morph";
import { evaluate } from "ts-evaluator";

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
            "final",
            identifierNodesFromJsxAttribute.map((n) => [n.getParent().getText(), extractJsxAttributeIdentifierValue(n)])
            // .filter((v) => !v[v.length - 1])
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

        const maybeValue = maybeLiteral(expression);
        if (isNotNullish(maybeValue)) return maybeValue;

        const type = expression.getType();
        if (type.isLiteral() || type.isUnionOrIntersection()) return parseType(type);

        // unresolvable condition (isDark) will return both possible outcome
        // const [isDark, setIsDark] = useColorMode();
        // <ColorBox color={isDark ? darkValue : "whiteAlpha.100"} />
        if (Node.isConditionalExpression(expression)) {
            return [maybeLiteral(expression.getWhenTrue()), maybeLiteral(expression.getWhenFalse())];
        }
    }
};

const findProperty = (node: ObjectLiteralElementLike, propName: string) => {
    if (Node.isPropertyAssignment(node)) {
        const name = node.getNameNode();

        if (Node.isIdentifier(name) && name.getText() === propName) {
            return node;
        }

        if (Node.isComputedPropertyName(name)) {
            const expression = name.getExpression();
            const computedPropName = maybeLiteral(expression);

            if (computedPropName === propName) {
                return node;
            }
        }
    }

    if (Node.isShorthandPropertyAssignment(node)) {
        const name = node.getNameNode();
        if (Node.isIdentifier(name) && name.getText() === propName) {
            return node;
        }
    }
};

const getPropValue = (initializer: ObjectLiteralExpression, propName: string) => {
    const property =
        initializer.getProperty(propName) ?? initializer.getProperties().find((p) => findProperty(p, propName));

    // console.log("props", {
    //     propName,
    //     property: property?.getText(),
    //     properties: initializer.getProperties().map((p) => p.getText()),
    //     propertyKind: property?.getKindName(),
    //     initializer: initializer.getText(),
    //     initializerKind: initializer.getKindName(),
    // });

    if (Node.isPropertyAssignment(property)) {
        const propInit = property.getInitializerOrThrow();
        const maybePropValue = maybeLiteral(propInit);

        if (maybePropValue) {
            return maybePropValue;
        }
    }

    if (Node.isShorthandPropertyAssignment(property)) {
        const propInit = property.getNameNode();
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
    const tailValues = tail.map((t) => {
        const expression = t.getExpression();
        return maybeLiteral(expression);
    });

    if (isNotNullish(headValue) && tailValues.every(isNotNullish)) {
        // console.log({ propName, headValue, tailValues });
        return headValue + tailValues.join("");
    }
};

const maybePropIdentifierDefinitionValue = (elementAccessed: Identifier, propName: string) => {
    const defs = elementAccessed.getDefinitionNodes();
    while (defs.length > 0) {
        const def = unwrapExpression(defs.shift()!);
        // console.log({
        //     def: def?.getText(),
        //     elementAccessed: elementAccessed.getText(),
        //     kind: def?.getKindName(),
        //     type: def?.getType().getText(),
        //     propName,
        // });

        if (Node.isVariableDeclaration(def)) {
            const initializer = unwrapExpression(def.getInitializerOrThrow());

            if (Node.isObjectLiteralExpression(initializer)) {
                return getPropValue(initializer, propName);
            }

            if (Node.isArrayLiteralExpression(initializer)) {
                const index = Number(propName);
                if (Number.isNaN(index)) return;

                const element = initializer.getElements()[index];
                if (!element) return;

                return maybeLiteral(element);
            }
        }
    }
};

function maybeLiteral(node: Node): string | undefined {
    // <ColorBox color={"xxx"} />
    if (Node.isStringLiteral(node)) {
        return node.getLiteralText();
    }

    // <ColorBox color={123} />
    if (Node.isNumericLiteral(node)) {
        return node.getLiteralText();
    }

    // <ColorBox color={staticColor} />
    if (Node.isIdentifier(node)) {
        return getIdentifierReferenceValue(node);
    }

    if (Node.isTemplateHead(node)) {
        return node.getLiteralText();
    }

    // <ColorBox color={`${xxx}yyy`} />
    if (Node.isTemplateExpression(node)) {
        return maybeTemplateStringValue(node);
    }

    // <ColorBox color={xxx[yyy]} /> / <ColorBox color={xxx["zzz"]} />
    if (Node.isElementAccessExpression(node)) {
        return getElementAccessedExpressionValue(node) as string;
    }

    // <ColorBox color={xxx.yyy} />
    if (Node.isPropertyAccessExpression(node)) {
        return getPropertyAccessedExpressionValue(node)!;
    }

    // <ColorBox color={isDark ? darkValue : "whiteAlpha.100"} />
    if (Node.isConditionalExpression(node)) {
        return evaluateExpression(node, node.getProject().getTypeChecker()) ?? undefined;
    }

    // <ColorBox color={fn()} />
    if (Node.isCallExpression(node)) {
        return evaluateExpression(node, node.getProject().getTypeChecker()) ?? undefined;
    }

    if (Node.isBinaryExpression(node)) {
        return (
            tryUnwrapBinaryExpression(node) ?? evaluateExpression(node, node.getProject().getTypeChecker()) ?? undefined
        );
    }

    console.log({ maybeLiteralEnd: true, node: node.getText(), kind: node.getKindName() });
}

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
    const defs = identifier.getDefinitionNodes();
    while (defs.length > 0) {
        const def = unwrapExpression(defs.shift()!);

        // console.log({
        //     def: def?.getText(),
        //     identifier: identifier.getText(),
        //     kind: def?.getKindName(),
        //     type: def?.getType().getText(),
        // });

        // const staticColor =
        if (Node.isVariableDeclaration(def)) {
            const initializer = unwrapExpression(def.getInitializerOrThrow());

            // const staticColor = "gray.100";
            if (Node.isStringLiteral(initializer)) {
                return initializer.getLiteralText();
            }

            // const index = 0;
            if (Node.isNumericLiteral(initializer)) {
                return initializer.getLiteralText();
            }

            const type = initializer.getType();
            if (type.isLiteral() || type.isUnionOrIntersection()) return parseType(type) as string;

            // console.log({
            //     getIdentifierReferenceValue: true,
            //     def: def?.getText(),
            //     identifier: identifier.getText(),
            //     kind: def?.getKindName(),
            //     type: def?.getType().getText(),
            //     initializer: initializer?.getText(),
            //     initializerKind: initializer?.getKindName(),
            // });

            if (Node.isPropertyAccessExpression(initializer)) {
                return getPropertyAccessedExpressionValue(initializer);
            }

            // if (Node.isIdentifier(initializer)) {
            //     return getIdentifierReferenceValue(initializer);
            // }
        }
    }
};

const tryUnwrapBinaryExpression = (node: BinaryExpression) => {
    if (node.getOperatorToken().getKind() !== ts.SyntaxKind.PlusToken) return;

    const left = unwrapExpression(node.getLeft());
    const right = unwrapExpression(node.getRight());

    const leftValue = maybeLiteral(left);
    const rightValue = maybeLiteral(right);

    // console.log({
    //     leftValue,
    //     rightValue,
    //     left: [left.getKindName(), left.getText()],
    //     right: [right.getKindName(), right.getText()],
    // });

    if (isNotNullish(leftValue) && isNotNullish(rightValue)) {
        return leftValue + rightValue;
    }
};

const getElementAccessedExpressionValue = (
    expression: ElementAccessExpression
): string | string[] | ObjectLiteralExpression | undefined => {
    const type = expression.getType();
    if (type.isLiteral() || type.isUnionOrIntersection()) return parseType(type);

    const elementAccessed = unwrapExpression(expression.getExpression());
    const arg = unwrapExpression(expression.getArgumentExpressionOrThrow());

    const argValue = maybeLiteral(arg);

    // console.log("yes", {
    //     arg: arg.getText(),
    //     argKind: arg.getKindName(),
    //     elementAccessed: elementAccessed.getText(),
    //     elementAccessedKind: elementAccessed.getKindName(),
    //     expression: expression.getText(),
    //     expressionKind: expression.getKindName(),
    //     argValue,
    // });

    // <ColorBox color={xxx["yyy"]} />
    if (Node.isIdentifier(elementAccessed) && isNotNullish(argValue)) {
        return maybePropIdentifierDefinitionValue(elementAccessed, argValue);
    }

    // <ColorBox color={xxx[yyy + "zzz"]} />
    if (Node.isBinaryExpression(arg)) {
        const propName = tryUnwrapBinaryExpression(arg) ?? maybeLiteral(arg);

        if (isNotNullish(propName) && Node.isIdentifier(elementAccessed)) {
            return maybePropIdentifierDefinitionValue(elementAccessed, propName);
        }
    }

    // <ColorBox color={xxx[`yyy`]} />
    if (Node.isTemplateExpression(arg)) {
        const propName = maybeTemplateStringValue(arg);

        if (isNotNullish(propName) && Node.isIdentifier(elementAccessed)) {
            return maybePropIdentifierDefinitionValue(elementAccessed, propName);
        }
    }

    // <ColorBox color={{ staticColor: "facebook.900" }["staticColor"]}></ColorBox>
    if (Node.isObjectLiteralExpression(elementAccessed) && isNotNullish(argValue)) {
        return getPropValue(elementAccessed, argValue);
    }

    // <ColorBox color={xxx[yyy.zzz]} />
    if (Node.isPropertyAccessExpression(arg)) {
        return getPropertyAccessedExpressionValue(arg);
    }

    // <ColorBox color={xxx[yyy[zzz]]} />
    if (Node.isIdentifier(elementAccessed) && Node.isElementAccessExpression(arg)) {
        const propName = getElementAccessedExpressionValue(arg) as string;

        if (isNotNullish(propName)) {
            return maybePropIdentifierDefinitionValue(elementAccessed, propName);
        }
    }

    // <ColorBox color={xxx[yyy[zzz]]} />
    if (Node.isElementAccessExpression(elementAccessed) && isNotNullish(argValue)) {
        const identifier = getElementAccessedExpressionValue(elementAccessed);
        if (Node.isNode(identifier) && Node.isObjectLiteralExpression(identifier)) {
            return getPropValue(identifier, argValue);
        }
    }

    // <ColorBox color={xxx[[yyy][zzz]]} />
    if (Node.isArrayLiteralExpression(elementAccessed) && isNotNullish(argValue)) {
        return getArrayElementValueAtIndex(elementAccessed, Number(argValue));
    }

    // <ColorBox color={xxx[aaa ? yyy : zzz]]} />
    if (Node.isConditionalExpression(arg)) {
        const propName = maybeLiteral(arg);
        if (isNotNullish(propName)) {
            if (Node.isIdentifier(elementAccessed)) {
                return maybePropIdentifierDefinitionValue(elementAccessed, propName);
            }

            // TODO
            // if (Node.isObjectLiteralExpression(elementAccessed)) {
            //     return getPropValue(elementAccessed, propName);
            // }

            // if (Node.isArrayLiteralExpression(elementAccessed)) {
            //     return getArrayElementValueAtIndex(elementAccessed, Number(propName));
            // }

            // if (Node.isElementAccessExpression(elementAccessed)) {
            //     const identifier = getElementAccessedExpressionValue(elementAccessed);
            //     if (Node.isNode(identifier) && Node.isObjectLiteralExpression(identifier)) {
            //         return getPropValue(identifier, propName);
            //     }
            // }
        }

        const whenTrue = unwrapExpression(arg.getWhenTrue());
        const whenFalse = unwrapExpression(arg.getWhenFalse());

        const whenTrueValue = maybeLiteral(whenTrue);
        const whenFalseValue = maybeLiteral(whenFalse);

        console.log({
            whenTrueValue,
            whenFalseValue,
            whenTrue: [whenTrue.getKindName(), whenTrue.getText()],
            whenFalse: [whenFalse.getKindName(), whenFalse.getText()],
        });

        if (Node.isIdentifier(elementAccessed)) {
            const whenTrueResolved = isNotNullish(whenTrueValue)
                ? maybePropIdentifierDefinitionValue(elementAccessed, whenTrueValue)
                : undefined;
            const whenFalseResolved = isNotNullish(whenFalseValue)
                ? maybePropIdentifierDefinitionValue(elementAccessed, whenFalseValue)
                : undefined;

            if (isNotNullish(whenTrueResolved) && isNotNullish(whenFalseResolved)) {
                return [whenTrueResolved, whenFalseResolved];
            }
        }
    }
};

const getArrayElementValueAtIndex = (array: ArrayLiteralExpression, index: number) => {
    const element = array.getElements()[index];
    if (!element) return;

    const value = maybeLiteral(element);
    // console.log({
    //     array: array.getText(),
    //     arrayKind: array.getKindName(),
    //     element: element.getText(),
    //     elementKind: element.getKindName(),
    //     value,
    // });

    if (isNotNullish(value)) {
        return value;
    }

    if (Node.isObjectLiteralExpression(element)) {
        return element;
    }
};

const getPropertyAccessedExpressionValue = (expression: PropertyAccessExpression): string | undefined => {
    const type = expression.getType();
    if (type.isLiteral() || type.isUnionOrIntersection()) return parseType(type) as string;

    const propName = expression.getName();
    const elementAccessed = unwrapExpression(expression.getExpression());

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

/**
 * Evaluates with strict policies restrictions
 * @see https://github.com/wessberg/ts-evaluator#setting-up-policies
 */
const evaluateExpression = (node: Expression, morphTypeChecker: TypeChecker): string | null => {
    const compilerNode = node.compilerNode;
    const typeChecker = morphTypeChecker.compilerObject;

    const result = evaluate({
        node: compilerNode as any,
        typeChecker: typeChecker as any,
        typescript: ts as any,
        policy: {
            deterministic: true,
            network: false,
            console: false,
            maxOps: 100,
            maxOpDuration: 1000,
            io: { read: false, write: false },
            process: { exit: false, spawnChild: false },
        },
    });

    console.log({
        compilerNode: compilerNode.getText(),
        compilerNodeKind: node.getKindName(),
        result: result.success ? result.value : undefined,
    });
    return result.success ? (result.value as string) : null;
};
