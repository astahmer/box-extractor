import { isObjectLiteral } from "pastable";
import type { ObjectLiteralElementLike, ObjectLiteralExpression } from "ts-morph";
import { Node, ts } from "ts-morph";

import { evaluateNode, isEvalError, safeEvaluateNode } from "./evaluate";
// eslint-disable-next-line import/no-cycle
import { getIdentifierReferenceValue, maybeStringLiteral } from "./maybeLiteral";
import type { ExtractedPropMap } from "./types";
import { isNotNullish, unwrapExpression } from "./utils";

export type MaybeObjectEntriesReturn = ObjectType | MapType | undefined;
export const emptyObjectType: ObjectType = { type: "object", value: {}, isEmpty: true };

export const maybeObjectEntries = (node: Node): MaybeObjectEntriesReturn => {
    if (Node.isObjectLiteralExpression(node)) {
        return { type: "map", value: getObjectLiteralExpressionPropPairs(node) };
    }

    // <ColorBox {...xxx} />
    if (Node.isIdentifier(node)) {
        const maybeObject = getIdentifierReferenceValue(node);
        if (!maybeObject || !Node.isNode(maybeObject)) return emptyObjectType;

        // <ColorBox {...objectLiteral} />
        if (Node.isObjectLiteralExpression(maybeObject)) {
            return { type: "map", value: getObjectLiteralExpressionPropPairs(maybeObject) };
        }
    }

    // <ColorBox {...(xxx ? yyy : zzz)} />
    if (Node.isConditionalExpression(node)) {
        const maybeObject = evaluateNode(node);

        // fallback to both possible outcome
        if (isEvalError(maybeObject)) {
            const whenTrue = maybeObjectEntries(node.getWhenTrue());
            const whenFalse = maybeObjectEntries(node.getWhenFalse());
            // console.log({ whenTrue, whenFalse });
            return { type: "map", value: mergePossibleEntries(whenTrue, whenFalse) };
        }

        if (isNotNullish(maybeObject) && isObjectLiteral(maybeObject)) {
            return { type: "object", value: maybeObject };
        }

        return { type: "object", value: {} };
    }

    // <ColorBox {...(condition && objectLiteral)} />
    if (Node.isBinaryExpression(node) && node.getOperatorToken().getKind() === ts.SyntaxKind.AmpersandAmpersandToken) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return emptyObjectType;

        if (isObjectLiteral(maybeObject)) {
            return { type: "object", value: maybeObject };
        }
    }

    if (Node.isCallExpression(node)) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return emptyObjectType;

        if (isObjectLiteral(maybeObject)) {
            return { type: "object", value: maybeObject };
        }
    }

    if (Node.isPropertyAccessExpression(node)) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return emptyObjectType;

        if (isObjectLiteral(maybeObject)) {
            return { type: "object", value: maybeObject };
        }
    }

    if (Node.isElementAccessExpression(node)) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return emptyObjectType;

        if (isObjectLiteral(maybeObject)) {
            return { type: "object", value: maybeObject };
        }
    }
};

export type ObjectType = { type: "object"; value: ExtractedPropMap; isEmpty?: boolean };
export type LiteralType = { type: "literal"; value: string | string[] };
type MapType = { type: "map"; value: MapTypeValue };

export type ExtractedType = ObjectType | LiteralType | MapType;
type MapTypeValue = Map<string, ExtractedType[]>;

const isObjectType = (value: Exclude<MaybeObjectEntriesReturn, undefined>): value is ObjectType =>
    "type" in value && value.type === "object";

const getObjectLiteralExpressionPropPairs = (expression: ObjectLiteralExpression): MapTypeValue => {
    // const extractedPropValues = [] as ExtractedPropPair[];
    const extractedPropValues = new Map() as MapTypeValue;

    const properties = expression.getProperties();
    properties.forEach((propElement) => {
        if (Node.isPropertyAssignment(propElement) || Node.isShorthandPropertyAssignment(propElement)) {
            const propName = getPropertyName(propElement);
            if (!propName) return;

            const initializer = unwrapExpression(propElement.getInitializerOrThrow());
            const propValues = extractedPropValues.get(propName) ?? [];
            if (!extractedPropValues.has(propName)) {
                extractedPropValues.set(propName, propValues);
            }

            const maybeObject = maybeObjectEntries(initializer);
            if (isNotNullish(maybeObject)) {
                propValues.push(maybeObject);
                return;
            }

            const maybeValue = maybeStringLiteral(initializer);
            if (isNotNullish(maybeValue)) {
                propValues.push({ type: "literal", value: maybeValue });
                return;
            }
        }

        if (Node.isSpreadAssignment(propElement)) {
            const initializer = unwrapExpression(propElement.getExpression());
            const extracted = maybeObjectEntries(initializer);
            if (isNotNullish(extracted)) {
                // TODO
                // extracted.forEach(([propName, value]) => {
                //     const propValues = extractedPropValues.get(propName) ?? [];
                //     if (!extractedPropValues.has(propName)) {
                //         extractedPropValues.set(propName, propValues);
                //     }
                //     propValues.push({ type: "literal", value });
                // });
            }
        }
    });

    return extractedPropValues;
    // return Object.fromEntries(extractedPropValues.entries());
};

const getPropertyName = (property: ObjectLiteralElementLike) => {
    if (Node.isPropertyAssignment(property)) {
        const node = unwrapExpression(property.getNameNode());

        // { propName: "value" }
        if (Node.isIdentifier(node)) {
            return node.getText();
        }

        // { [computed]: "value" }
        if (Node.isComputedPropertyName(node)) {
            const expression = node.getExpression();
            const computedPropName = maybeStringLiteral(expression);
            if (isNotNullish(computedPropName)) return computedPropName;
        }
    }

    // { shorthand }
    if (Node.isShorthandPropertyAssignment(property)) {
        const name = property.getName();
        if (isNotNullish(name)) return name;
    }
};

export const maybeObjectEntriesReturnToMap = (maybeObject: MaybeObjectEntriesReturn): MapTypeValue => {
    if (!maybeObject) return new Map<string, ExtractedType[]>();
    if (maybeObject instanceof Map) return maybeObject;

    return new Map<string, ExtractedType[]>(
        Object.entries(maybeObject.value).map(([key, value]) => [key, [{ type: "literal", value }]])
    );
};

/**
 * TODO
 * whenTrue: [ [ 'color', 'never.250' ] ],
 * whenFalse: [ [ 'color', [ 'salmon.850', 'salmon.900' ] ] ],
 * merged: [ [ 'color', [ 'never.250', 'salmon.850', 'salmon.900' ] ] ]
 */
const mergePossibleEntries = (_whenTrue: MaybeObjectEntriesReturn, _whenFalse: MaybeObjectEntriesReturn) => {
    const whenTrue = maybeObjectEntriesReturnToMap(_whenTrue);
    const whenFalse = maybeObjectEntriesReturnToMap(_whenFalse);
    const merged = new Map() as MapTypeValue;

    whenTrue.forEach((propValues, propName) => {
        const whenFalsePairWithPropName = whenFalse.get(propName);
        if (whenFalsePairWithPropName) {
            merged.set(propName, propValues.concat(whenFalsePairWithPropName));
            return;
        }

        merged.set(propName, propValues);
    });

    whenFalse.forEach((propValues, propName) => {
        if (merged.has(propName)) return;

        const whenTruePairWithPropName = whenTrue.get(propName);
        if (whenTruePairWithPropName) {
            merged.set(propName, propValues.concat(whenTruePairWithPropName));
            return;
        }

        merged.set(propName, propValues);
    });

    return merged;
};
