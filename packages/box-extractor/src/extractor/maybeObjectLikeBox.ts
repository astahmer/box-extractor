import { createLogger } from "@box-extractor/logger";
import { isObjectLiteral } from "pastable";
import type { ObjectLiteralElementLike, ObjectLiteralExpression } from "ts-morph";
import { Node, ts } from "ts-morph";

import { evaluateNode, isEvalError, safeEvaluateNode } from "./evaluate";
// eslint-disable-next-line import/no-cycle
import { getIdentifierReferenceValue, maybeBoxNode, maybePropName } from "./maybeBoxNode";
import {
    box,
    BoxNode,
    BoxNodeLiteral,
    BoxNodeMap,
    BoxNodeObject,
    BoxNodeUnresolvable,
    castObjectLikeAsMapValue,
    isBoxNode,
    MapTypeValue,
} from "./type-factory";
import { isNotNullish, unwrapExpression } from "./utils";

const logger = createLogger("box-ex:extractor:maybe-object");
const cacheMap = new WeakMap<Node, MaybeObjectLikeBoxReturn>();

export type MaybeObjectLikeBoxReturn = BoxNodeObject | BoxNodeMap | BoxNodeUnresolvable | undefined;

export const maybeObjectLikeBox = (node: Node, stack: Node[]): MaybeObjectLikeBoxReturn => {
    const isCached = cacheMap.has(node);
    logger({ kind: node.getKindName(), isCached });
    if (isCached) return cacheMap.get(node);

    const cache = (value: MaybeObjectLikeBoxReturn) => {
        cacheMap.set(node, value);
        return value;
    };

    if (Node.isObjectLiteralExpression(node)) {
        return cache(getObjectLiteralExpressionPropPairs(node, stack));
    }

    // <ColorBox {...xxx} />
    if (Node.isIdentifier(node)) {
        const maybeObject = getIdentifierReferenceValue(node, stack);
        if (!maybeObject) return cache(box.unresolvable(node, stack));
        if (isBoxNode(maybeObject) && (maybeObject.type === "object" || maybeObject.type === "map")) {
            const first = Array.isArray(maybeObject) ? maybeObject[0] : maybeObject;
            if (!first) return cache(box.unresolvable(node, stack));

            return first;
        }

        if (!maybeObject || !Node.isNode(maybeObject)) return cache(box.unresolvable(node, stack));

        // <ColorBox {...objectLiteral} />
        if (Node.isObjectLiteralExpression(maybeObject)) {
            return cache(getObjectLiteralExpressionPropPairs(maybeObject, stack));
        }
    }

    // <ColorBox {...(xxx ? yyy : zzz)} />
    if (Node.isConditionalExpression(node)) {
        const maybeObject = evaluateNode(node);

        // fallback to both possible outcome
        if (isEvalError(maybeObject)) {
            const whenTrue = maybeObjectLikeBox(node.getWhenTrue(), stack);
            const whenFalse = maybeObjectLikeBox(node.getWhenFalse(), stack);
            logger.scoped("cond", { whenTrue, whenFalse });
            return cache(box.map(mergePossibleEntries(whenTrue, whenFalse, node), node, stack));
        }

        if (isNotNullish(maybeObject) && isObjectLiteral(maybeObject)) {
            return cache(box.object(maybeObject, node, stack));
        }

        return cache(box.emptyObject(node, stack));
    }

    // <ColorBox {...(condition && objectLiteral)} />
    if (Node.isBinaryExpression(node) && node.getOperatorToken().getKind() === ts.SyntaxKind.AmpersandAmpersandToken) {
        // TODO eval as fallback instead
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return cache(box.unresolvable(node, stack));

        if (isObjectLiteral(maybeObject)) {
            return cache(box.object(maybeObject, node, stack));
        }
    }

    if (Node.isCallExpression(node)) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return cache(box.unresolvable(node, stack));

        if (isObjectLiteral(maybeObject)) {
            return cache(box.object(maybeObject, node, stack));
        }
    }

    if (Node.isPropertyAccessExpression(node)) {
        // TODO eval as fallback instead
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return cache(box.unresolvable(node, stack));

        if (isObjectLiteral(maybeObject)) {
            return cache(box.object(maybeObject, node, stack));
        }
    }

    if (Node.isElementAccessExpression(node)) {
        // TODO eval as fallback instead
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return cache(box.unresolvable(node, stack));

        if (isObjectLiteral(maybeObject)) {
            return cache(box.object(maybeObject, node, stack));
        }
    }
};

const getObjectLiteralExpressionPropPairs = (expression: ObjectLiteralExpression, _stack: Node[]): BoxNodeMap => {
    const extractedPropValues = [] as Array<[string, BoxNode[]]>;
    // console.log({
    //     expression: expression.getText(),
    //     properties: expression.getProperties().map((prop) => prop.getText()),
    // });

    const properties = expression.getProperties();
    properties.forEach((propElement) => {
        const stack = [..._stack];

        stack.push(propElement);

        if (Node.isPropertyAssignment(propElement) || Node.isShorthandPropertyAssignment(propElement)) {
            const propNameBox = getPropertyName(propElement, stack);
            if (!propNameBox) return;

            const propName = propNameBox.value;
            if (!isNotNullish(propName)) return;

            const init = propElement.getInitializer();
            if (!init) return;

            const initializer = unwrapExpression(init);
            stack.push(initializer);
            logger.scoped("prop", { propName, kind: initializer.getKindName() });

            const maybeValue = maybeBoxNode(initializer, stack);
            if (isNotNullish(maybeValue)) {
                const value = box.cast(maybeValue, initializer, stack);
                if (!value) return;

                extractedPropValues.push([propName.toString(), Array.isArray(value) ? value : [value]]);
                return;
            }

            const maybeObject = maybeObjectLikeBox(initializer, stack);
            // console.log({ maybeObject });
            if (isNotNullish(maybeObject)) {
                extractedPropValues.push([propName.toString(), [maybeObject]]);
                return;
            }
        }

        if (Node.isSpreadAssignment(propElement)) {
            const initializer = unwrapExpression(propElement.getExpression());
            stack.push(initializer);

            const extracted = maybeObjectLikeBox(initializer, stack);
            if (!isNotNullish(extracted)) return;

            logger("isSpreadAssignment", extracted);
            if (extracted.type === "object") {
                Object.entries(extracted.value).forEach(([propName, value]) => {
                    const boxed = box.cast(value, initializer, stack);
                    if (!boxed) return;

                    extractedPropValues.push([propName, [boxed]]);
                });
                return;
            }

            if (box.isMap(extracted)) {
                extracted.value.forEach((value, propName) => {
                    value.forEach((nested) => {
                        const boxed = box.cast(nested, initializer, stack);
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

    return box.map(map, expression, _stack);
};

const getPropertyName = (property: ObjectLiteralElementLike, stack: Node[]): BoxNodeLiteral | undefined => {
    if (Node.isPropertyAssignment(property)) {
        const node = unwrapExpression(property.getNameNode());

        // { propName: "value" }
        if (Node.isIdentifier(node)) {
            return box.cast(node.getText(), node, stack);
        }

        // { [computed]: "value" }
        if (Node.isComputedPropertyName(node)) {
            const expression = node.getExpression();
            stack.push(expression);

            const computedPropName = maybePropName(expression, stack);
            if (isNotNullish(computedPropName)) return computedPropName;
        }

        // { "propName": "value" }
        if (Node.isStringLiteral(node)) {
            return box.cast(node.getLiteralText(), node, stack);
        }

        // { "propName": "value" }
        if (Node.isNumericLiteral(node)) {
            return box.cast(node.getLiteralText(), node, stack);
        }
    }

    // { shorthand }
    if (Node.isShorthandPropertyAssignment(property)) {
        const name = property.getName();
        if (isNotNullish(name)) return box.cast(name, property, stack);
    }
};

/**
 * TODO - rewrite comment as map rather than entries after refactoring
 * whenTrue: [ [ 'color', 'never.250' ] ],
 * whenFalse: [ [ 'color', [ 'salmon.850', 'salmon.900' ] ] ],
 * merged: [ [ 'color', [ 'never.250', 'salmon.850', 'salmon.900' ] ] ]
 */
const mergePossibleEntries = (
    _whenTrue: MaybeObjectLikeBoxReturn,
    _whenFalse: MaybeObjectLikeBoxReturn,
    node: Node
) => {
    const whenTrue = castObjectLikeAsMapValue(_whenTrue, node);
    const whenFalse = castObjectLikeAsMapValue(_whenFalse, node);
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
