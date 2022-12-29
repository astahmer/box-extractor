import { isObject } from "pastable";
import type {
    ArrayLiteralExpression,
    BinaryExpression,
    ElementAccessExpression,
    Identifier,
    ObjectLiteralElementLike,
    ObjectLiteralExpression,
    PropertyAccessExpression,
    TemplateExpression,
} from "ts-morph";
import { Node, ts } from "ts-morph";

import { safeEvaluateNode } from "./evaluate";
// eslint-disable-next-line import/no-cycle
import { maybeObjectEntries, MaybeObjectEntriesReturn } from "./maybeObjectEntries";
import {
    box,
    ConditionalType,
    ExtractedType,
    isPrimitiveType,
    LiteralValue,
    narrowCondionalType,
    NodeObjectLiteralExpressionType,
    toBoxType,
} from "./type-factory";
import type { ExtractedPropMap, PrimitiveType } from "./types";
import { isNotNullish, unwrapExpression } from "./utils";

const innerGetLiteralValue = (
    valueType: PrimitiveType | ExtractedType | NodeObjectLiteralExpressionType
): LiteralValue | LiteralValue[] | undefined => {
    if (isPrimitiveType(valueType)) return valueType;
    if (valueType.type === "literal") return valueType.value;
    if (valueType.type === "node-object-literal") return;

    if (valueType.type === "object") {
        if (valueType.isEmpty) return;
        return valueType.value;
    }

    if (valueType.type === "map") {
        const entries = Array.from(valueType.value.entries())
            .map(([key, value]) => [key, getLiteralValue(value)])
            .filter(([_key, value]) => isNotNullish(value));

        return Object.fromEntries(entries);
    }

    if (valueType.type === "conditional") {
        // const possibleValues = [] as Array<Exclude<ExtractedType,ConditionalType>>
        const narrowed = narrowCondionalType(valueType);
        console.log({ narrowed });
        if (narrowed.length === 1) {
            console.log("narrowed.length === 1", getLiteralValue(narrowed[0]));
            return getLiteralValue(narrowed[0]);
        }

        return narrowed
            .map((value) => getLiteralValue(value))
            .filter(isNotNullish)
            .flat();
    }
};

export const getLiteralValue = (maybeLiteral: MaybeLiteralReturn): LiteralValue | LiteralValue[] | undefined => {
    if (!isNotNullish(maybeLiteral)) return;

    if (Array.isArray(maybeLiteral)) {
        const values = maybeLiteral.map((valueType) => innerGetLiteralValue(valueType)).filter(isNotNullish);
        if (values.length === 0) return;

        const flat = values.flat();
        if (flat.length === 1) return flat[0];
        return flat;
    }

    return innerGetLiteralValue(maybeLiteral);
};

// const evalToLiteralType = (
//     value: PrimitiveType | ExtractedPropMap | undefined
// ): LiteralType | ObjectType | undefined => {
//     if (!isNotNullish(value)) return;

//     if (isPrimitiveType(value)) return { type: "literal", value };
//     if (isObject(value)) return { type: "object", value };
// };

type MaybeLiteralReturn =
    | string
    | string[]
    | ExtractedType
    | ExtractedType[]
    | NodeObjectLiteralExpressionType
    | undefined;

export function maybeLiteral(node: Node): MaybeLiteralReturn {
    // console.log("maybeLiteral", node.getKindName(), node.getText());

    // <ColorBox color={"xxx"} />
    if (Node.isStringLiteral(node)) {
        return node.getLiteralText();
    }

    // <ColorBox color={`xxx`} />
    if (Node.isNoSubstitutionTemplateLiteral(node)) {
        return node.getLiteralText();
    }

    // <ColorBox color={123} />
    if (Node.isNumericLiteral(node)) {
        return node.getLiteralText();
    }

    // <ColorBox color={staticColor} />
    if (Node.isIdentifier(node)) {
        const value = getIdentifierReferenceValue(node);
        if (isNotNullish(value) && !Node.isNode(value)) {
            return value;
        }
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
        return getElementAccessedExpressionValue(node);
    }

    // <ColorBox color={xxx.yyy} />
    if (Node.isPropertyAccessExpression(node)) {
        const evaluated = getPropertyAccessedExpressionValue(node)!;
        return toBoxType(evaluated);
    }

    // <ColorBox color={isDark ? darkValue : "whiteAlpha.100"} />
    if (Node.isConditionalExpression(node)) {
        return maybeExpandConditionalExpression(node);
    }

    // <ColorBox color={fn()} />
    if (Node.isCallExpression(node)) {
        const maybeValue = safeEvaluateNode<PrimitiveType | ExtractedPropMap>(node);
        return toBoxType(maybeValue);
    }

    if (Node.isBinaryExpression(node)) {
        return tryUnwrapBinaryExpression(node) ?? safeEvaluateNode<string>(node);
    }

    // console.log({ maybeLiteralEnd: true, node: node.getText(), kind: node.getKindName() });
}

export const maybeStringLiteral = (node: Node) => {
    const literal = maybeLiteral(node);
    // console.log({ literal });
    if (!isNotNullish(literal)) return;

    if (typeof literal === "string") {
        return literal;
    }

    if (isObject(literal) && "type" in literal && literal.type === "literal" && typeof literal.value === "string") {
        return literal.value;
    }
};

const maybeExpandConditionalExpression = (
    node: Node
): ExtractedType | ExtractedType[] | MaybeObjectEntriesReturn | NodeObjectLiteralExpressionType => {
    // const maybeExpandConditionalExpression = (node: Node): ReturnType<typeof maybeLiteral> | ReturnType<typeof maybeObjectEntries>|[ReturnType<typeof maybeLiteral> | ReturnType<typeof maybeObjectEntries>] | undefined => {
    // <ColorBox color={isDark ? darkValue : "whiteAlpha.100"} />
    if (Node.isConditionalExpression(node)) {
        const maybeValue = safeEvaluateNode<PrimitiveType | PrimitiveType[] | ExtractedPropMap>(node);
        if (isNotNullish(maybeValue)) return toBoxType(maybeValue);

        // unresolvable condition will return both possible outcome
        const whenTrueExpr = unwrapExpression(node.getWhenTrue());
        const whenFalseExpr = unwrapExpression(node.getWhenFalse());

        let whenTrueValue: ReturnType<typeof maybeLiteral> | ReturnType<typeof maybeObjectEntries> =
            maybeLiteral(whenTrueExpr);
        let whenFalseValue: ReturnType<typeof maybeLiteral> | ReturnType<typeof maybeObjectEntries> =
            maybeLiteral(whenFalseExpr);

        // <ColorBox color={isDark ? { mobile: "blue.100", desktop: "blue.300" } : "whiteAlpha.100"} />
        if (!isNotNullish(whenTrueValue)) {
            const maybeObject = maybeObjectEntries(whenTrueExpr);
            if (isNotNullish(maybeObject)) {
                whenTrueValue = maybeObject;
            }
        }

        // <ColorBox color={isDark ? { mobile: "blue.100", desktop: "blue.300" } : "whiteAlpha.100"} />
        if (!isNotNullish(whenFalseValue)) {
            const maybeObject = maybeObjectEntries(whenFalseExpr);
            if (isNotNullish(maybeObject)) {
                whenFalseValue = maybeObject;
            }
        }

        // console.log({
        //     whenTrueLiteral: unwrapExpression(node.getWhenTrue()).getText(),
        //     whenFalseLiteral: unwrapExpression(node.getWhenFalse()).getText(),
        //     whenTrueValue,
        //     whenFalseValue,
        // });

        if (!whenTrueValue && !whenFalseValue) {
            return;
        }

        if (whenTrueValue && !whenFalseValue) {
            // TODO type: "array" ?
            return toBoxType(whenTrueValue);
        }

        if (!whenTrueValue && whenFalseValue) {
            return toBoxType(whenFalseValue);
        }

        return box.conditional(toBoxType(whenTrueValue as any), toBoxType(whenFalseValue as any));
    }
};

const findProperty = (node: ObjectLiteralElementLike, propName: string) => {
    // console.log({ node: node.getText(), kind: node.getKindName() });

    if (Node.isPropertyAssignment(node)) {
        const name = node.getNameNode();
        // console.log({ name: name.getText(), kind: name.getKindName() });

        if (Node.isIdentifier(name) && name.getText() === propName) {
            return node;
        }

        if (Node.isComputedPropertyName(name)) {
            const expression = name.getExpression();
            const computedPropName = maybeStringLiteral(expression);
            // console.log({ computedPropName, propName, expression: expression.getText() });

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

    console.log("props", {
        propName,
        property: property?.getText(),
        properties: initializer.getProperties().map((p) => p.getText()),
        propertyKind: property?.getKindName(),
        initializer: initializer.getText(),
        initializerKind: initializer.getKindName(),
    });

    if (Node.isPropertyAssignment(property)) {
        const propInit = property.getInitializerOrThrow();
        const maybePropValue = maybeStringLiteral(propInit);

        if (maybePropValue) {
            return maybePropValue;
        }
    }

    if (Node.isShorthandPropertyAssignment(property)) {
        const propInit = property.getNameNode();
        const maybePropValue = maybeStringLiteral(propInit);

        if (maybePropValue) {
            return maybePropValue;
        }
    }
};

const maybeTemplateStringValue = (template: TemplateExpression) => {
    const head = template.getHead();
    const tail = template.getTemplateSpans();

    const headValue = maybeStringLiteral(head);
    const tailValues = tail.map((t) => {
        const expression = t.getExpression();
        return maybeLiteral(expression);
    });

    console.log({ head: head.getText(), headValue, tailValues });

    if (isNotNullish(headValue) && tailValues.every(isNotNullish)) {
        // console.log({ propName, headValue, tailValues });
        return headValue + tailValues.join("");
    }
};

const maybePropIdentifierDefinitionValue = (elementAccessed: Identifier, propName: string) => {
    const defs = elementAccessed.getDefinitionNodes();
    while (defs.length > 0) {
        const def = unwrapExpression(defs.shift()!);
        console.log({
            def: def?.getText(),
            elementAccessed: elementAccessed.getText(),
            kind: def?.getKindName(),
            type: def?.getType().getText(),
            propName,
        });

        if (Node.isVariableDeclaration(def)) {
            const initializer = unwrapExpression(def.getInitializerOrThrow());
            console.log({ initializer: initializer.getText(), kind: initializer.getKindName(), propName });

            if (Node.isObjectLiteralExpression(initializer)) {
                return getPropValue(initializer, propName);
            }

            if (Node.isArrayLiteralExpression(initializer)) {
                const index = Number(propName);
                if (Number.isNaN(index)) return;

                const element = initializer.getElements()[index];
                if (!element) return;

                return maybeStringLiteral(element);
            }
        }
    }
};

export const getIdentifierReferenceValue = (identifier: Identifier) => {
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

            const maybeValue = maybeLiteral(initializer);
            if (isNotNullish(maybeValue)) return maybeValue;

            if (Node.isObjectLiteralExpression(initializer)) {
                return box.nodeObjectLiteral(initializer);
            }

            // console.log({
            //     getIdentifierReferenceValue: true,
            //     def: def?.getText(),
            //     identifier: identifier.getText(),
            //     kind: def?.getKindName(),
            //     type: def?.getType().getText(),
            //     initializer: initializer?.getText(),
            //     initializerKind: initializer?.getKindName(),
            // });
        }
    }
};

const tryUnwrapBinaryExpression = (node: BinaryExpression) => {
    if (node.getOperatorToken().getKind() !== ts.SyntaxKind.PlusToken) return;

    const left = unwrapExpression(node.getLeft());
    const right = unwrapExpression(node.getRight());

    const leftValue = maybeStringLiteral(left);
    const rightValue = maybeStringLiteral(right);

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

const getElementAccessedExpressionValue = (expression: ElementAccessExpression): MaybeLiteralReturn => {
    const elementAccessed = unwrapExpression(expression.getExpression());
    const arg = unwrapExpression(expression.getArgumentExpressionOrThrow());

    const argValue = maybeStringLiteral(arg);

    console.log("yes", {
        arg: arg.getText(),
        argKind: arg.getKindName(),
        elementAccessed: elementAccessed.getText(),
        elementAccessedKind: elementAccessed.getKindName(),
        expression: expression.getText(),
        expressionKind: expression.getKindName(),
        argValue,
    });

    // <ColorBox color={xxx["yyy"]} />
    if (Node.isIdentifier(elementAccessed) && isNotNullish(argValue)) {
        return maybePropIdentifierDefinitionValue(elementAccessed, argValue);
    }

    // <ColorBox color={xxx[yyy + "zzz"]} />
    if (Node.isBinaryExpression(arg)) {
        const propName = tryUnwrapBinaryExpression(arg) ?? maybeStringLiteral(arg);

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
        const propValue = getPropertyAccessedExpressionValue(arg);
        return toBoxType(propValue);
    }

    // <ColorBox color={xxx[yyy[zzz]]} />
    if (Node.isIdentifier(elementAccessed) && Node.isElementAccessExpression(arg)) {
        const propName = getElementAccessedExpressionValue(arg);
        console.log({ isArgElementAccessExpression: true, propName });

        if (typeof propName === "string" && isNotNullish(propName)) {
            return maybePropIdentifierDefinitionValue(elementAccessed, propName);
        }
    }

    // <ColorBox color={xxx[yyy[zzz]]} />
    if (Node.isElementAccessExpression(elementAccessed) && isNotNullish(argValue)) {
        const identifier = getElementAccessedExpressionValue(elementAccessed);
        console.log({ isElementAccessExpression: true, identifier });

        // if (Node.isNode(identifier) && Node.isObjectLiteralExpression(identifier)) {
        if (isObject(identifier) && !Array.isArray(identifier) && identifier.type === "node-object-literal") {
            return getPropValue(identifier.value, argValue);
            // if (isObject(identifier) && !Array.isArray(identifier) && identifier.type === "map") {
            //     return identifier.value.get(argValue);
        }
    }

    // <ColorBox color={xxx[[yyy][zzz]]} />
    if (Node.isArrayLiteralExpression(elementAccessed) && isNotNullish(argValue)) {
        return getArrayElementValueAtIndex(elementAccessed, Number(argValue));
    }

    // <ColorBox color={xxx[aaa ? yyy : zzz]]} />
    if (Node.isConditionalExpression(arg)) {
        const propName = maybeStringLiteral(arg);
        console.log({ isConditionalExpression: true, propName });
        // eslint-disable-next-line sonarjs/no-collapsible-if
        if (isNotNullish(propName)) {
            // eslint-disable-next-line unicorn/no-lonely-if
            if (Node.isIdentifier(elementAccessed)) {
                return maybePropIdentifierDefinitionValue(elementAccessed, propName);
            }
        }

        const whenTrue = unwrapExpression(arg.getWhenTrue());
        const whenFalse = unwrapExpression(arg.getWhenFalse());

        const whenTrueValue = maybeStringLiteral(whenTrue);
        const whenFalseValue = maybeStringLiteral(whenFalse);

        // console.log({
        //     whenTrueValue,
        //     whenFalseValue,
        //     whenTrue: [whenTrue.getKindName(), whenTrue.getText()],
        //     whenFalse: [whenFalse.getKindName(), whenFalse.getText()],
        // });

        if (Node.isIdentifier(elementAccessed)) {
            const whenTrueResolved = isNotNullish(whenTrueValue)
                ? maybePropIdentifierDefinitionValue(elementAccessed, whenTrueValue)
                : undefined;
            const whenFalseResolved = isNotNullish(whenFalseValue)
                ? maybePropIdentifierDefinitionValue(elementAccessed, whenFalseValue)
                : undefined;

            return [whenTrueResolved, whenFalseResolved].flat().filter(isNotNullish);
        }
    }
};

const getArrayElementValueAtIndex = (array: ArrayLiteralExpression, index: number) => {
    const element = array.getElements()[index];
    if (!element) return;

    const value = maybeLiteral(element);
    console.log({
        array: array.getText(),
        arrayKind: array.getKindName(),
        element: element.getText(),
        elementKind: element.getKindName(),
        value,
        obj: maybeObjectEntries(element),
    });

    if (isNotNullish(value)) {
        return value;
    }

    if (Node.isObjectLiteralExpression(element)) {
        // TODO opti ?
        // return maybeObjectEntries(element);
        return box.nodeObjectLiteral(element);
    }
};

const getPropertyAccessedExpressionValue = (expression: PropertyAccessExpression) => {
    const maybeValue = safeEvaluateNode<PrimitiveType | PrimitiveType[] | ExtractedPropMap>(expression);
    if (isNotNullish(maybeValue)) return maybeValue;

    const propName = expression.getName();
    const elementAccessed = unwrapExpression(expression.getExpression());

    if (Node.isIdentifier(elementAccessed)) {
        return maybePropIdentifierDefinitionValue(elementAccessed, propName);
    }
};
