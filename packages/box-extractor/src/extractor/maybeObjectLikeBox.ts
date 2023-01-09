import { isObjectLiteral } from "pastable";
import type { ObjectLiteralElementLike, ObjectLiteralExpression } from "ts-morph";
import { Node, ts } from "ts-morph";
import { createLogger } from "@box-extractor/logger";

import { evaluateNode, isEvalError, safeEvaluateNode } from "./evaluate";
// eslint-disable-next-line import/no-cycle
import { getIdentifierReferenceValue, maybeBoxNode, maybeStringLiteral } from "./maybeBoxNode";
import {
    box,
    castObjectLikeAsMapValue,
    emptyObjectType,
    BoxNode,
    isBoxNode,
    MapType,
    MapTypeValue,
    ObjectType,
} from "./type-factory";
import { isNotNullish, unwrapExpression } from "./utils";

const logger = createLogger("box-ex:extractor:maybe-object");

export type MaybeObjectLikeBoxReturn = ObjectType | MapType | undefined;

export const maybeObjectLikeBox = (node: Node): MaybeObjectLikeBoxReturn => {
    logger({ kind: node.getKindName() });

    if (Node.isObjectLiteralExpression(node)) {
        return box.map(getObjectLiteralExpressionPropPairs(node));
    }

    // <ColorBox {...xxx} />
    if (Node.isIdentifier(node)) {
        const maybeObject = getIdentifierReferenceValue(node);
        if (!maybeObject) return emptyObjectType;
        if (isBoxNode(maybeObject) && maybeObject.type === "node-object-literal") {
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
            const whenTrue = maybeObjectLikeBox(node.getWhenTrue());
            const whenFalse = maybeObjectLikeBox(node.getWhenFalse());
            logger.scoped("cond", { whenTrue, whenFalse });
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
    const extractedPropValues = [] as Array<[string, BoxNode[]]>;
    // console.log({
    //     expression: expression.getText(),
    //     properties: expression.getProperties().map((prop) => prop.getText()),
    // });

    const properties = expression.getProperties();
    properties.forEach((propElement) => {
        if (Node.isPropertyAssignment(propElement) || Node.isShorthandPropertyAssignment(propElement)) {
            const propName = getPropertyName(propElement);
            if (!propName) return;

            const init = propElement.getInitializer();
            if (!init) return;

            const initializer = unwrapExpression(init);
            logger.scoped("prop", { propName, kind: initializer.getKindName() });

            const maybeValue = maybeBoxNode(initializer);
            if (isNotNullish(maybeValue)) {
                const value = box.cast(maybeValue);
                if (!value) return;

                extractedPropValues.push([propName, [value]]);
                return;
            }

            const maybeObject = maybeObjectLikeBox(initializer);
            // console.log({ maybeObject });
            if (isNotNullish(maybeObject)) {
                extractedPropValues.push([propName, [maybeObject]]);
                return;
            }
        }

        if (Node.isSpreadAssignment(propElement)) {
            const initializer = unwrapExpression(propElement.getExpression());
            const extracted = maybeObjectLikeBox(initializer);
            if (!isNotNullish(extracted)) return;

            logger("isSpreadAssignment", extracted);
            if (extracted.type === "object") {
                Object.entries(extracted.value).forEach(([propName, value]) => {
                    const boxed = box.cast(value);
                    if (!boxed) return;

                    extractedPropValues.push([propName, [boxed]]);
                });
                return;
            }

            if (extracted.type === "map") {
                extracted.value.forEach((value, propName) => {
                    value.forEach((nested) => {
                        const boxed = box.cast(nested);
                        if (!boxed) return;

                        return extractedPropValues.push([propName, [boxed]]);
                    });
                });
            }
        }
    });

    // preserves order of insertion, useful for spread operator to override props
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

        // { "propName": "value" }
        if (Node.isStringLiteral(node)) {
            return node.getLiteralText();
        }
    }

    // { shorthand }
    if (Node.isShorthandPropertyAssignment(property)) {
        const name = property.getName();
        if (isNotNullish(name)) return name;
    }
};

/**
 * TODO - rewrite comment as map rather than entries after refactoring
 * whenTrue: [ [ 'color', 'never.250' ] ],
 * whenFalse: [ [ 'color', [ 'salmon.850', 'salmon.900' ] ] ],
 * merged: [ [ 'color', [ 'never.250', 'salmon.850', 'salmon.900' ] ] ]
 */
const mergePossibleEntries = (_whenTrue: MaybeObjectLikeBoxReturn, _whenFalse: MaybeObjectLikeBoxReturn) => {
    const whenTrue = castObjectLikeAsMapValue(_whenTrue);
    const whenFalse = castObjectLikeAsMapValue(_whenFalse);
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
