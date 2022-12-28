import debug from "debug";
import { isObjectLiteral } from "pastable";
import type { ObjectLiteralElementLike, ObjectLiteralExpression } from "ts-morph";
import { Node, ts } from "ts-morph";

import { evaluateNode, isEvalError, safeEvaluateNode } from "./evaluate";
// eslint-disable-next-line import/no-cycle
import { getIdentifierReferenceValue, maybeLiteral, maybeStringLiteral } from "./maybeLiteral";
import type { ExtractedPropMap, ExtractedPropPair } from "./types";
import { isNotNullish, unwrapExpression } from "./utils";

const logger = debug("box-ex:extractor:object");
// TODO return
// { type: "object", value: ExtractedPropMap } instead of ExtractedPropMap
// { type: "pairs", value: ExtractedPropPair[] } instead of ExtractedPropPair[]
// { type: "literals", value: string[] } instead of string[]
// etc

export const maybeObjectEntries = (node: Node, propName?: string): ExtractedPropPair[] | undefined => {
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
    // <ColorBox css={xxx ? yyy : zzz} />
    if (Node.isConditionalExpression(node)) {
        const maybeObject = evaluateNode(node);

        // fallback to both possible outcome
        if (isEvalError(maybeObject)) {
            const whenTrueExpr = unwrapExpression(node.getWhenTrue());
            const whenFalseExpr = unwrapExpression(node.getWhenFalse());

            let whenTrue = maybeObjectEntries(whenTrueExpr) ?? [];
            let whenFalse = maybeObjectEntries(whenFalseExpr) ?? [];

            if (whenTrue.length > 0 && whenFalse.length > 0) {
                const merged = mergePossibleEntries(whenTrue, whenFalse);
                if (merged.length > 0) return merged;
            }

            if (propName) {
                if (whenTrue.length === 0) {
                    const literal = maybeLiteral(whenTrueExpr);
                    if (isNotNullish(literal)) {
                        whenTrue = [[propName, literal]] as ExtractedPropPair[];
                    }
                }

                if (whenFalse.length === 0) {
                    const literal = maybeLiteral(whenFalseExpr);
                    if (isNotNullish(literal)) {
                        whenFalse = [[propName, literal]] as ExtractedPropPair[];
                    }
                }
            }

            logger({ whenTrue, whenFalse, propName, whenFalseLiteral: maybeStringLiteral(whenFalseExpr) });
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

    // <ColorBox {...fn()} />
    if (Node.isCallExpression(node)) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return [];

        if (isObjectLiteral(maybeObject)) {
            return Object.entries(maybeObject);
        }
    }

    // <ColorBox {...obj.prop} />
    if (Node.isPropertyAccessExpression(node)) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return [];

        if (isObjectLiteral(maybeObject)) {
            return Object.entries(maybeObject);
        }
    }

    // <ColorBox {...obj[element]} />
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

            const maybeObject = maybeObjectEntries(initializer, propName);
            if (isNotNullish(maybeObject) && maybeObject.length > 0) {
                const pairs = [] as typeof maybeObject;
                maybeObject.forEach(([name, value]) => {
                    if (name === propName) {
                        extractedPropValues.push([name, value]);
                        return;
                    }

                    pairs.push([name, value]);
                });
                if (pairs.length === 0) return;

                extractedPropValues.push([propName, Object.fromEntries(pairs) as ExtractedPropMap]);
                return;
            }

            if (isNotNullish(maybeValue)) {
                extractedPropValues.push([propName, maybeValue]);
                return;
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
    const merged = new Map<string, Set<string | ExtractedPropMap>>();

    whenTrue.forEach(([propName, _propValues]) => {
        const propValues = (Array.isArray(_propValues) ? _propValues : [_propValues]) as Array<
            string | ExtractedPropMap
        >;
        const whenFalsePairWithPropName = whenFalse.find(([prop]) => prop === propName);
        if (whenFalsePairWithPropName) {
            const whenFalse = whenFalsePairWithPropName[1];
            merged.set(propName, new Set([...propValues, ...(Array.isArray(whenFalse) ? whenFalse : [whenFalse])]));
            return;
        }

        logger({ propName, propValues, whenTrue, whenFalse });
        merged.set(propName, new Set(propValues));
    });

    whenFalse.forEach(([propName, _propValues]) => {
        if (merged.has(propName)) return;

        const propValues = (Array.isArray(_propValues) ? _propValues : [_propValues]) as Array<
            string | ExtractedPropMap
        >;
        const whenTruePairWithPropName = whenTrue.find(([prop]) => prop === propName);
        if (whenTruePairWithPropName) {
            const whenTrue = whenTruePairWithPropName[1];
            merged.set(propName, new Set([...propValues, ...(Array.isArray(whenTrue) ? whenTrue : [whenTrue])]));
            return;
        }

        logger({ propName, propValues, whenTrue, whenFalse });
        merged.set(propName, new Set(propValues));
    });

    return Array.from(merged.entries()).map(([propName, propValues]) => [
        propName,
        Array.from(propValues),
    ]) as ExtractedPropPair[];
};
