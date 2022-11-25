import { castAsArray, isObjectLiteral } from "pastable";
import type { ObjectLiteralElementLike, ObjectLiteralExpression } from "ts-morph";
import { Node, ts } from "ts-morph";

import { evaluateNode, isEvalError, safeEvaluateNode } from "./evaluate";
// eslint-disable-next-line import/no-cycle
import { getIdentifierReferenceValue, maybeStringLiteral } from "./maybeLiteral";
import type { ExtractedPropPair } from "./types";
import { isNotNullish, parseType, unwrapExpression } from "./utils";

export const maybeObjectEntries = (node: Node): ExtractedPropPair[] | undefined => {
    if (Node.isObjectLiteralExpression(node)) {
        return getObjectLiteralExpressionPropPairs(node);
    }

    // <ColorBox {...xxx} />
    if (Node.isIdentifier(node)) {
        const maybeObject = getIdentifierReferenceValue(node);
        if (!maybeObject || !Node.isNode(maybeObject)) return [];

        // <ColorBox {...objectLiteral} />
        if (Node.isObjectLiteralExpression(maybeObject)) {
            return getObjectLiteralExpressionPropPairs(maybeObject);
        }
    }

    // <ColorBox {...(xxx ? yyy : zzz)} />
    if (Node.isConditionalExpression(node)) {
        const maybeObject = evaluateNode(node);

        // fallback to both possible outcome
        if (isEvalError(maybeObject)) {
            const whenTrue = maybeObjectEntries(node.getWhenTrue()) ?? [];
            const whenFalse = maybeObjectEntries(node.getWhenFalse()) ?? [];
            // console.log({ whenTrue, whenFalse });
            return mergePossibleEntries(whenTrue, whenFalse);
        }

        if (isNotNullish(maybeObject) && isObjectLiteral(maybeObject)) {
            return Object.entries(maybeObject);
        }

        return [];
    }

    // <ColorBox {...(condition && objectLiteral)} />
    if (Node.isBinaryExpression(node) && node.getOperatorToken().getKind() === ts.SyntaxKind.AmpersandAmpersandToken) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return [];

        if (isObjectLiteral(maybeObject)) {
            return Object.entries(maybeObject);
        }
    }

    if (Node.isCallExpression(node)) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return [];

        if (isObjectLiteral(maybeObject)) {
            return Object.entries(maybeObject);
        }
    }

    if (Node.isPropertyAccessExpression(node)) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return [];

        if (isObjectLiteral(maybeObject)) {
            return Object.entries(maybeObject);
        }
    }

    if (Node.isElementAccessExpression(node)) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return [];

        if (isObjectLiteral(maybeObject)) {
            return Object.entries(maybeObject);
        }
    }
};

const getObjectLiteralExpressionPropPairs = (expression: ObjectLiteralExpression) => {
    const extractedPropValues = [] as ExtractedPropPair[];

    const properties = expression.getProperties();
    properties.forEach((propElement) => {
        if (Node.isPropertyAssignment(propElement) || Node.isShorthandPropertyAssignment(propElement)) {
            const propName = getPropertyName(propElement);
            if (!propName) return;

            const initializer = unwrapExpression(propElement.getInitializerOrThrow());
            const maybeValue = maybeStringLiteral(initializer);

            if (isNotNullish(maybeValue)) {
                extractedPropValues.push([propName, maybeValue]);
                return;
            }

            const maybeType = parseType(expression.getType());
            if (isNotNullish(maybeType)) {
                if (typeof maybeType === "string") {
                    extractedPropValues.push([propName, maybeType]);
                    return;
                }

                if (!Array.isArray(maybeType)) return;

                maybeType.forEach((possibleValue) => {
                    extractedPropValues.push([propName, possibleValue]);
                });
            }
        }

        if (Node.isSpreadAssignment(propElement)) {
            const initializer = unwrapExpression(propElement.getExpression());
            const extracted = maybeObjectEntries(initializer);
            if (extracted) {
                extracted.forEach(([propName, value]) => {
                    extractedPropValues.push([propName, value]);
                });
            }
        }
    });

    return extractedPropValues;
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

/**
 * whenTrue: [ [ 'color', 'never.250' ] ],
 * whenFalse: [ [ 'color', [ 'salmon.850', 'salmon.900' ] ] ],
 * merged: [ [ 'color', [ 'never.250', 'salmon.850', 'salmon.900' ] ] ]
 */
const mergePossibleEntries = (whenTrue: ExtractedPropPair[], whenFalse: ExtractedPropPair[]) => {
    const merged = new Map<string, Set<string>>();

    whenTrue.forEach(([propName, propValues]) => {
        const whenFalsePairWithPropName = whenFalse.find(([prop]) => prop === propName);
        if (whenFalsePairWithPropName) {
            merged.set(propName, new Set([...castAsArray(propValues), ...castAsArray(whenFalsePairWithPropName[1])]));
            return;
        }

        merged.set(propName, new Set(castAsArray(propValues)));
    });

    whenFalse.forEach(([propName, propValues]) => {
        if (merged.has(propName)) return;

        const whenTruePairWithPropName = whenTrue.find(([prop]) => prop === propName);
        if (whenTruePairWithPropName) {
            merged.set(propName, new Set([...castAsArray(propValues), ...castAsArray(whenTruePairWithPropName[1])]));
            return;
        }

        merged.set(propName, new Set(castAsArray(propValues)));
    });

    return Array.from(merged.entries()).map(([propName, propValues]) => [
        propName,
        Array.from(propValues),
    ]) as ExtractedPropPair[];
};
