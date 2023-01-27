import { createLogger } from "@box-extractor/logger";
import { castAsArray, isObject } from "pastable";
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
import { maybeObjectLikeBox, MaybeObjectLikeBoxReturn } from "./maybeObjectLikeBox";
import { box, BoxNode, ConditionalKind, isBoxNode } from "./type-factory";
import type { ExtractedPropMap, PrimitiveType } from "./types";
import { isNotNullish, unwrapExpression } from "./utils";

const logger = createLogger("box-ex:extractor:maybe-box");

export type MaybeBoxNodeReturn = BoxNode | BoxNode[] | undefined;
export function maybeBoxNode(node: Node): MaybeBoxNodeReturn {
    logger({ kind: node.getKindName() });

    // <ColorBox color={"xxx"} />
    if (Node.isStringLiteral(node)) {
        return box.literal(node.getLiteralText(), node);
    }

    // <ColorBox color={[xxx, yyy, zzz]} />
    if (Node.isArrayLiteralExpression(node)) {
        const boxes = node.getElements().map((element) => {
            const maybeBox = maybeBoxNode(element);
            if (!maybeBox) return box.unresolvable(element);

            return Array.isArray(maybeBox) ? box.list(maybeBox, node) : maybeBox;
        });

        return box.list(boxes, node);
    }

    // <ColorBox color={`xxx`} />
    if (Node.isNoSubstitutionTemplateLiteral(node)) {
        return box.literal(node.getLiteralText(), node);
    }

    // <ColorBox color={123} />
    if (Node.isNumericLiteral(node)) {
        return box.literal(node.getLiteralText(), node);
    }

    // <ColorBox bool={true} falsy={false} />
    if (Node.isTrueLiteral(node) || Node.isFalseLiteral(node)) {
        return box.literal(node.getLiteralValue(), node);
    }

    // <ColorBox color={staticColor} />
    if (Node.isIdentifier(node)) {
        const value = getIdentifierReferenceValue(node);
        if (isNotNullish(value) && !Node.isNode(value)) {
            return value;
        }
    }

    if (Node.isTemplateHead(node)) {
        return box.literal(node.getLiteralText(), node);
    }

    // <ColorBox color={`${xxx}yyy`} />
    if (Node.isTemplateExpression(node)) {
        const maybeString = maybeTemplateStringValue(node);
        if (!maybeString) return;

        return box.literal(maybeString, node);
    }

    // <ColorBox color={xxx[yyy]} /> / <ColorBox color={xxx["zzz"]} />
    if (Node.isElementAccessExpression(node)) {
        return getElementAccessedExpressionValue(node);
    }

    // <ColorBox color={xxx.yyy} />
    if (Node.isPropertyAccessExpression(node)) {
        const evaluated = getPropertyAccessedExpressionValue(node)!;
        return box.cast(evaluated, node);
    }

    // <ColorBox color={isDark ? darkValue : "whiteAlpha.100"} />
    if (Node.isConditionalExpression(node)) {
        const maybeValue = safeEvaluateNode<PrimitiveType | PrimitiveType[] | ExtractedPropMap>(node);
        if (isNotNullish(maybeValue)) return box.cast(maybeValue, node);

        // unresolvable condition will return both possible outcome
        const whenTrueExpr = unwrapExpression(node.getWhenTrue());
        const whenFalseExpr = unwrapExpression(node.getWhenFalse());

        return maybeExpandConditionalExpression({ whenTrueExpr, whenFalseExpr, node, kind: "ternary" });
    }

    // <ColorBox color={fn()} />
    if (Node.isCallExpression(node)) {
        const maybeValue = safeEvaluateNode<PrimitiveType | ExtractedPropMap>(node);
        return box.cast(maybeValue, node);
    }

    if (Node.isBinaryExpression(node)) {
        const operatorKind = node.getOperatorToken().getKind();
        if (operatorKind === ts.SyntaxKind.PlusToken) {
            const maybeString = tryUnwrapBinaryExpression(node) ?? safeEvaluateNode<string>(node);
            if (!maybeString) return;

            return box.literal(maybeString, node);
        } else if (
            operatorKind === ts.SyntaxKind.BarBarToken ||
            operatorKind === ts.SyntaxKind.QuestionQuestionToken ||
            operatorKind === ts.SyntaxKind.AmpersandAmpersandToken
        ) {
            const whenTrueExpr = unwrapExpression(node.getLeft());
            const whenFalseExpr = unwrapExpression(node.getRight());

            return maybeExpandConditionalExpression({
                whenTrueExpr,
                whenFalseExpr,
                node,
                kind: conditionalKindByOperatorKind[operatorKind],
                canReturnWhenTrue: true,
            });
        }
    }

    // console.log({ maybeBoxNodeEnd: true, expression: node.getText(), kind: node.getKindName() });
}

const conditionalKindByOperatorKind = {
    [ts.SyntaxKind.BarBarToken]: "or" as ConditionalKind,
    [ts.SyntaxKind.QuestionQuestionToken]: "nullish-coalescing" as ConditionalKind,
    [ts.SyntaxKind.AmpersandAmpersandToken]: "and" as ConditionalKind,
};

export const onlyStringLiteral = (box: MaybeBoxNodeReturn) => {
    if (!isNotNullish(box)) return;

    if (typeof box === "string") {
        return box;
    }

    if (isObject(box) && "type" in box && box.type === "literal" && typeof box.value === "string") {
        return box.value;
    }
};

const onlyNumberLiteral = (box: MaybeBoxNodeReturn) => {
    if (!isNotNullish(box)) return;

    if (typeof box === "number") {
        return box;
    }

    if (isObject(box) && "type" in box && box.type === "literal" && typeof box.value === "number") {
        return box.value;
    }
};

// const onlyPrimitiveLiteral = (box: MaybeBoxNodeReturn) => {
//     if (!isNotNullish(box)) return;

//     if (typeof box === "string" || typeof box === "number" || typeof box === "boolean") {
//         return box;
//     }

//     if (isObject(box) && "type" in box && box.type === "literal" && typeof box.value !== "object") {
//         return box.value;
//     }
// };
// const maybePrimitiveLiteral = (node: Node) => onlyPrimitiveLiteral(maybeBoxNode(node));

const maybeStringLiteral = (node: Node): string | undefined => onlyStringLiteral(maybeBoxNode(node));

export const maybePropName = (node: Node) => {
    const boxed = maybeBoxNode(node);
    const string = onlyStringLiteral(boxed);
    if (string) return string;

    const number = onlyNumberLiteral(boxed);
    if (isNotNullish(number)) return String(number);
};

// <ColorBox color={isDark ? darkValue : "whiteAlpha.100"} />
const maybeExpandConditionalExpression = ({
    whenTrueExpr,
    whenFalseExpr,
    node,
    kind,
    canReturnWhenTrue,
}: {
    whenTrueExpr: Node;
    whenFalseExpr: Node;
    node: Node;
    kind: ConditionalKind;
    canReturnWhenTrue?: boolean;
}): BoxNode | BoxNode[] | MaybeObjectLikeBoxReturn => {
    let whenTrueValue: ReturnType<typeof maybeBoxNode> | ReturnType<typeof maybeObjectLikeBox> =
        maybeBoxNode(whenTrueExpr);
    let whenFalseValue: ReturnType<typeof maybeBoxNode> | ReturnType<typeof maybeObjectLikeBox> =
        maybeBoxNode(whenFalseExpr);

    logger.scoped("cond", { before: true, whenTrueValue, whenFalseValue });

    // <ColorBox color={isDark ? { mobile: "blue.100", desktop: "blue.300" } : "whiteAlpha.100"} />
    if (!isNotNullish(whenTrueValue)) {
        const maybeObject = maybeObjectLikeBox(whenTrueExpr);
        if (isNotNullish(maybeObject) && !(maybeObject.type === "object" && maybeObject.isEmpty)) {
            whenTrueValue = maybeObject;
        }
    }

    if (canReturnWhenTrue && isNotNullish(whenTrueValue)) {
        return box.cast(whenTrueValue, whenTrueExpr);
    }

    // <ColorBox color={isDark ? { mobile: "blue.100", desktop: "blue.300" } : "whiteAlpha.100"} />
    if (!isNotNullish(whenFalseValue)) {
        const maybeObject = maybeObjectLikeBox(whenFalseExpr);
        if (isNotNullish(maybeObject) && !(maybeObject.type === "object" && maybeObject.isEmpty)) {
            whenFalseValue = maybeObject;
        }
    }

    logger.lazyScoped("cond", () => ({
        whenTrueLiteral: whenTrueExpr.getText(),
        whenFalseLiteral: whenFalseExpr.getText(),
        whenTrueValue,
        whenFalseValue,
    }));

    if (!whenTrueValue && !whenFalseValue) {
        return;
    }

    if (whenTrueValue && !whenFalseValue) {
        return box.cast(whenTrueValue, whenTrueExpr);
    }

    if (!whenTrueValue && whenFalseValue) {
        return box.cast(whenFalseValue, whenFalseExpr);
    }

    const whenTrue = whenTrueValue!;
    const whenFalse = whenFalseValue!;

    if (Array.isArray(whenTrue) || Array.isArray(whenFalse)) {
        const merged = castAsArray(whenTrue).concat(whenFalse);
        if (merged.length === 1) return merged[0];

        return merged;
    }

    return box.conditional(whenTrue, whenFalse, node, kind);
};

const findProperty = (node: ObjectLiteralElementLike, propName: string) => {
    logger.scoped("find-prop", { propName, kind: node.getKindName() });

    if (Node.isPropertyAssignment(node)) {
        const name = node.getNameNode();
        // console.log({ name: name.getText(), kind: name.getKindName() });

        if (Node.isIdentifier(name) && name.getText() === propName) {
            return node;
        }

        if (Node.isStringLiteral(name)) {
            return name.getLiteralText();
        }

        if (Node.isComputedPropertyName(name)) {
            const expression = name.getExpression();
            const computedPropName = maybePropName(expression);
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

    logger.lazyScoped("get-prop", () => ({
        propName,
        property: property?.getText(),
        properties: initializer.getProperties().map((p) => p.getText()),
        propertyKind: property?.getKindName(),
        initializer: initializer.getText(),
        initializerKind: initializer.getKindName(),
    }));

    if (Node.isPropertyAssignment(property)) {
        const propInit = property.getInitializer();
        if (!propInit) return;

        // TODO ?
        const maybePropValue = maybeStringLiteral(propInit);
        if (maybePropValue) {
            return maybePropValue;
        }
    }

    if (Node.isShorthandPropertyAssignment(property)) {
        const propInit = property.getNameNode();
        // TODO ?
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
        return maybePropName(expression);
    });

    // logger(({ head: head.getText(), headValue, tailValues }));

    if (isNotNullish(headValue) && tailValues.every(isNotNullish)) {
        // console.log({ propName, headValue, tailValues });
        return headValue + tailValues.join("");
    }
};

const maybePropIdentifierDefinitionValue = (elementAccessed: Identifier, propName: string) => {
    const defs = elementAccessed.getDefinitionNodes();
    while (defs.length > 0) {
        const def = unwrapExpression(defs.shift()!);
        logger.lazyScoped("id-def", () => ({
            def: def?.getText(),
            elementAccessed: elementAccessed.getText(),
            kind: def?.getKindName(),
            type: def?.getType().getText(),
            propName,
        }));

        if (Node.isVariableDeclaration(def)) {
            const init = def.getInitializer();
            if (!init) return;

            const initializer = unwrapExpression(init);
            logger.lazyScoped("id-def", () => ({
                initializer: initializer.getText(),
                kind: initializer.getKindName(),
                propName,
            }));

            if (Node.isObjectLiteralExpression(initializer)) {
                return getPropValue(initializer, propName);
            }

            if (Node.isArrayLiteralExpression(initializer)) {
                const index = Number(propName);
                if (Number.isNaN(index)) return;

                const element = initializer.getElements()[index];
                if (!element) return;

                // TODO ?
                return maybeStringLiteral(element);
            }
        }
    }
};

export const getIdentifierReferenceValue = (identifier: Identifier) => {
    const defs = identifier.getDefinitionNodes();
    while (defs.length > 0) {
        const def = unwrapExpression(defs.shift()!);

        // logger(({
        //     def: def?.getText(),
        //     identifier: identifier.getText(),
        //     kind: def?.getKindName(),
        //     type: def?.getType().getText(),
        // }));

        // const staticColor =
        if (Node.isVariableDeclaration(def)) {
            const init = def.getInitializer();
            if (!init) return;

            const initializer = unwrapExpression(init);
            const maybeValue = maybeBoxNode(initializer);
            if (isNotNullish(maybeValue)) return maybeValue;

            if (Node.isObjectLiteralExpression(initializer)) {
                logger.scoped("get-id-value");
                return maybeObjectLikeBox(initializer);
            }

            // logger(({
            //     getIdentifierReferenceValue: true,
            //     def: def?.getText(),
            //     identifier: identifier.getText(),
            //     kind: def?.getKindName(),
            //     type: def?.getType().getText(),
            //     initializer: initializer?.getText(),
            //     initializerKind: initializer?.getKindName(),
            // }));
        }
    }
};

const tryUnwrapBinaryExpression = (node: BinaryExpression) => {
    const left = unwrapExpression(node.getLeft());
    const right = unwrapExpression(node.getRight());

    const leftValue = maybePropName(left);
    const rightValue = maybePropName(right);

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

const elAccessedLogger = logger.extend("element-access");

const getElementAccessedExpressionValue = (expression: ElementAccessExpression): MaybeBoxNodeReturn => {
    const elementAccessed = unwrapExpression(expression.getExpression());
    const argExpr = expression.getArgumentExpression();
    if (!argExpr) return;

    const arg = unwrapExpression(argExpr);
    const argValue = maybePropName(arg);

    elAccessedLogger.lazy(() => ({
        arg: arg.getText(),
        argKind: arg.getKindName(),
        elementAccessed: elementAccessed.getText(),
        elementAccessedKind: elementAccessed.getKindName(),
        expression: expression.getText(),
        expressionKind: expression.getKindName(),
        argValue,
        argLiteral: maybeBoxNode(arg),
    }));

    // <ColorBox color={xxx["yyy"]} />
    if (Node.isIdentifier(elementAccessed) && isNotNullish(argValue)) {
        const maybeValue = maybePropIdentifierDefinitionValue(elementAccessed, argValue);
        if (!maybeValue) return;

        return box.literal(maybeValue, expression);
    }

    // <ColorBox color={xxx[yyy + "zzz"]} />
    if (Node.isBinaryExpression(arg)) {
        if (arg.getOperatorToken().getKind() !== ts.SyntaxKind.PlusToken) return;

        const propName = tryUnwrapBinaryExpression(arg) ?? maybePropName(arg);

        if (isNotNullish(propName) && Node.isIdentifier(elementAccessed)) {
            const maybeValue = maybePropIdentifierDefinitionValue(elementAccessed, propName);
            if (!maybeValue) return;

            return box.literal(maybeValue, expression);
        }
    }

    // <ColorBox color={xxx[`yyy`]} />
    if (Node.isTemplateExpression(arg)) {
        const propName = maybeTemplateStringValue(arg);

        if (isNotNullish(propName) && Node.isIdentifier(elementAccessed)) {
            const maybeValue = maybePropIdentifierDefinitionValue(elementAccessed, propName);
            if (!maybeValue) return;

            return box.literal(maybeValue, expression);
        }
    }

    // <ColorBox color={{ staticColor: "facebook.900" }["staticColor"]}></ColorBox>
    if (Node.isObjectLiteralExpression(elementAccessed) && isNotNullish(argValue)) {
        const maybeValue = getPropValue(elementAccessed, argValue);
        if (!maybeValue) return;

        return box.literal(maybeValue, expression);
    }

    // <ColorBox color={xxx[yyy.zzz]} />
    if (Node.isPropertyAccessExpression(arg)) {
        const propValue = getPropertyAccessedExpressionValue(arg);
        return box.cast(propValue, arg);
    }

    // <ColorBox color={xxx[yyy[zzz]]} />
    if (Node.isIdentifier(elementAccessed) && Node.isElementAccessExpression(arg)) {
        const propName = getElementAccessedExpressionValue(arg);
        elAccessedLogger({ isArgElementAccessExpression: true, propName });

        if (typeof propName === "string" && isNotNullish(propName)) {
            const maybeValue = maybePropIdentifierDefinitionValue(elementAccessed, propName);
            if (!maybeValue) return;

            return box.literal(maybeValue, expression);
        }
    }

    // <ColorBox color={xxx[yyy[zzz]]} />
    if (Node.isElementAccessExpression(elementAccessed) && isNotNullish(argValue)) {
        const identifier = getElementAccessedExpressionValue(elementAccessed);
        elAccessedLogger({ isElementAccessExpression: true, identifier, argValue });

        if (
            isObject(identifier) &&
            !Array.isArray(identifier) &&
            (identifier.type === "object" || identifier.type === "map")
        ) {
            const maybeValue =
                identifier.type === "object" ? identifier.value[argValue] : identifier.value.get(argValue);
            elAccessedLogger({ isElementAccessExpression: true, maybeValue });
            if (maybeValue) {
                const first = Array.isArray(maybeValue) ? maybeValue[0] : maybeValue;
                return isBoxNode(first) ? first : box.cast(first, expression);
            }

            if (!maybeValue) return;
        }
    }

    // <ColorBox color={xxx[[yyy][zzz]]} />
    if (Node.isArrayLiteralExpression(elementAccessed) && isNotNullish(argValue)) {
        return getArrayElementValueAtIndex(elementAccessed, Number(argValue));
    }

    // <ColorBox color={xxx[aaa ? yyy : zzz]]} />
    if (Node.isConditionalExpression(arg)) {
        // TODO maybePropName ?
        const propName = maybeStringLiteral(arg);
        elAccessedLogger({ isConditionalExpression: true, propName });
        // eslint-disable-next-line sonarjs/no-collapsible-if
        if (isNotNullish(propName)) {
            // eslint-disable-next-line unicorn/no-lonely-if
            if (Node.isIdentifier(elementAccessed)) {
                const maybeValue = maybePropIdentifierDefinitionValue(elementAccessed, propName);
                if (!maybeValue) return;

                return box.literal(maybeValue, expression);
            }
        }

        const whenTrueExpr = unwrapExpression(arg.getWhenTrue());
        const whenFalseExpr = unwrapExpression(arg.getWhenFalse());

        // TODO ?
        const whenTrueValue = maybeStringLiteral(whenTrueExpr);
        const whenFalseValue = maybeStringLiteral(whenFalseExpr);

        elAccessedLogger({
            conditionalElementAccessed: true,
            whenTrueValue,
            whenFalseValue,
            whenTrue: [whenTrueExpr.getKindName(), whenTrueExpr.getText()],
            whenFalse: [whenFalseExpr.getKindName(), whenFalseExpr.getText()],
        });

        if (Node.isIdentifier(elementAccessed)) {
            const whenTrueResolved = isNotNullish(whenTrueValue)
                ? maybePropIdentifierDefinitionValue(elementAccessed, whenTrueValue)
                : undefined;
            const whenFalseResolved = isNotNullish(whenFalseValue)
                ? maybePropIdentifierDefinitionValue(elementAccessed, whenFalseValue)
                : undefined;

            if (!whenTrueResolved && !whenFalseResolved) {
                return;
            }

            if (whenTrueResolved && !whenFalseResolved) {
                return box.literal(whenTrueResolved, whenTrueExpr);
            }

            if (!whenTrueResolved && whenFalseResolved) {
                return box.literal(whenFalseResolved, whenFalseExpr);
            }

            const whenTrue = box.literal(whenTrueResolved, whenTrueExpr);
            const whenFalse = box.literal(whenFalseResolved, whenFalseExpr);

            return box.conditional(whenTrue, whenFalse, arg, "ternary");
        }
    }
};

const getArrayElementValueAtIndex = (array: ArrayLiteralExpression, index: number) => {
    const element = array.getElements()[index];
    if (!element) return;

    const value = maybeBoxNode(element);
    elAccessedLogger({
        array: array.getText(),
        arrayKind: array.getKindName(),
        element: element.getText(),
        elementKind: element.getKindName(),
        value,
        obj: maybeObjectLikeBox(element),
    });

    if (isNotNullish(value)) {
        return value;
    }

    if (Node.isObjectLiteralExpression(element)) {
        return maybeObjectLikeBox(element);
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
