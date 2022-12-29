import { isObjectLiteral } from "pastable";
import type { ObjectLiteralElementLike, ObjectLiteralExpression } from "ts-morph";
import { Node, ts } from "ts-morph";

import { evaluateNode, isEvalError, safeEvaluateNode } from "./evaluate";
// eslint-disable-next-line import/no-cycle
import { getIdentifierReferenceValue, maybeStringLiteral } from "./maybeLiteral";
import {
    box,
    emptyObjectType,
    ExtractedType,
    isBoxType,
    LiteralType,
    MapType,
    MapTypeValue,
    ObjectType,
    toBoxType,
} from "./type-factory";
import type { ExtractedPropPair } from "./types";
import { isNotNullish, unwrapExpression } from "./utils";

export type MaybeObjectEntriesReturn = ObjectType | MapType | undefined;

export const maybeObjectEntries = (node: Node): MaybeObjectEntriesReturn => {
    if (Node.isObjectLiteralExpression(node)) {
        return box.map(getObjectLiteralExpressionPropPairs(node));
    }

    // <ColorBox {...xxx} />
    if (Node.isIdentifier(node)) {
        const maybeObject = getIdentifierReferenceValue(node);
        if (!maybeObject) return emptyObjectType;
        if (isBoxType(maybeObject) && maybeObject.type === "node-object-literal") {
            return box.map(getObjectLiteralExpressionPropPairs(maybeObject.value));
        }

        if (!maybeObject || !Node.isNode(maybeObject)) return emptyObjectType;

        // <ColorBox {...objectLiteral} />
        if (Node.isObjectLiteralExpression(maybeObject)) {
            return box.map(getObjectLiteralExpressionPropPairs(maybeObject));
        }
    }

    // <ColorBox {...(xxx ? yyy : zzz)} />
    if (Node.isConditionalExpression(node)) {
        const maybeObject = evaluateNode(node);

        // fallback to both possible outcome
        if (isEvalError(maybeObject)) {
            const whenTrue = maybeObjectEntries(node.getWhenTrue());
            const whenFalse = maybeObjectEntries(node.getWhenFalse());
            console.log({ whenTrue, whenFalse });
            return box.map(mergePossibleEntries(whenTrue, whenFalse));
        }

        if (isNotNullish(maybeObject) && isObjectLiteral(maybeObject)) {
            return box.object(maybeObject);
        }

        return emptyObjectType;
    }

    // <ColorBox {...(condition && objectLiteral)} />
    if (Node.isBinaryExpression(node) && node.getOperatorToken().getKind() === ts.SyntaxKind.AmpersandAmpersandToken) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return emptyObjectType;

        if (isObjectLiteral(maybeObject)) {
            return box.object(maybeObject);
        }
    }

    if (Node.isCallExpression(node)) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return emptyObjectType;

        if (isObjectLiteral(maybeObject)) {
            return box.object(maybeObject);
        }
    }

    if (Node.isPropertyAccessExpression(node)) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return emptyObjectType;

        if (isObjectLiteral(maybeObject)) {
            return box.object(maybeObject);
        }
    }

    if (Node.isElementAccessExpression(node)) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return emptyObjectType;

        if (isObjectLiteral(maybeObject)) {
            return box.object(maybeObject);
        }
    }
};

const getObjectLiteralExpressionPropPairs = (expression: ObjectLiteralExpression): MapTypeValue => {
    const extractedPropValues = [] as Array<[string, ExtractedType[]]>;
    console.log({
        expression: expression.getText(),
        properties: expression.getProperties().map((prop) => prop.getText()),
    });

    const properties = expression.getProperties();
    properties.forEach((propElement) => {
        if (Node.isPropertyAssignment(propElement) || Node.isShorthandPropertyAssignment(propElement)) {
            const propName = getPropertyName(propElement);
            if (!propName) return;
            console.log({ propName, extractedPropValues });

            const initializer = unwrapExpression(propElement.getInitializerOrThrow());

            const maybeObject = maybeObjectEntries(initializer);
            if (isNotNullish(maybeObject)) {
                extractedPropValues.push([propName, [maybeObject]]);
                return;
            }

            const maybeValue = maybeStringLiteral(initializer);
            if (isNotNullish(maybeValue)) {
                extractedPropValues.push([propName, [box.literal(maybeValue)]]);
                return;
            }
        }

        if (Node.isSpreadAssignment(propElement)) {
            const initializer = unwrapExpression(propElement.getExpression());
            const extracted = maybeObjectEntries(initializer);
            if (!isNotNullish(extracted)) return;

            console.log("isSpreadAssignment", extracted);
            if (extracted.type === "object") {
                Object.entries(extracted.value).forEach(([propName, value]) => {
                    extractedPropValues.push([propName, [box.literal(value)]]);
                });
                return;
            }

            if (extracted.type === "map") {
                extracted.value.forEach((value, propName) => {
                    value.forEach((nested) => {
                        const boxed = toBoxType(nested);
                        if (!boxed) return;
                        return extractedPropValues.push([propName, [boxed]]);
                    });
                });
            }
        }
    });

    // return extractedPropValues;
    // return Object.fromEntries(extractedPropValues.entries());
    // return Object.fromEntries(extractedPropValues);
    // console.dir({ extractedPropValues }, { depth: 10 });
    // return new Map(extractedPropValues);

    // preserves order of insertion
    const map = new Map();
    extractedPropValues.forEach(([propName, value]) => {
        if (map.has(propName)) {
            map.delete(propName);
        }

        map.set(propName, value);
    });

    return map;
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

export const castObjectLikeAsMapValue = (maybeObject: MaybeObjectEntriesReturn): MapTypeValue => {
    if (!maybeObject) return new Map<string, ExtractedType[]>();
    if (maybeObject instanceof Map) return maybeObject;
    if (!isBoxType(maybeObject)) return new Map<string, ExtractedType[]>(Object.entries(maybeObject));
    if (maybeObject.type === "map") return maybeObject.value;

    return new Map<string, ExtractedType[]>(
        Object.entries(maybeObject.value).map(([key, value]) => [key, [box.literal(value)]])
    );
};

/**
 * TODO
 * whenTrue: [ [ 'color', 'never.250' ] ],
 * whenFalse: [ [ 'color', [ 'salmon.850', 'salmon.900' ] ] ],
 * merged: [ [ 'color', [ 'never.250', 'salmon.850', 'salmon.900' ] ] ]
 */
const mergePossibleEntries = (_whenTrue: MaybeObjectEntriesReturn, _whenFalse: MaybeObjectEntriesReturn) => {
    const whenTrue = castObjectLikeAsMapValue(_whenTrue);
    const whenFalse = castObjectLikeAsMapValue(_whenFalse);
    const merged = new Map() as MapTypeValue;
    console.dir({ whenTrue, whenFalse }, { depth: null });

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
