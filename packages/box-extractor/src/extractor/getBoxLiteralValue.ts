/* eslint-disable @typescript-eslint/naming-convention */
import type { MaybeBoxNodeReturn } from "./maybeBoxNode";
import { box, BoxNode, castObjectLikeAsMapValue, LiteralValue, SingleLiteralValue } from "./type-factory";
import { isNotNullish } from "./utils";
import { createLogger } from "@box-extractor/logger";

// const logger = createLogger("box-ex:extractor:get-literal");

const cacheMap = new WeakMap();
const innerGetLiteralValue = (node: BoxNode | undefined): LiteralValue | undefined => {
    if (!node) return;
    if (box.isUnresolvable(node)) return;
    if (box.isEmptyInitializer(node)) return;

    if (box.isLiteral(node)) return node.value;
    if (box.isObject(node)) return node.value;
    if (box.isMap(node)) {
        const entries = Array.from(node.value.entries())
            .map(([key, value]) => [key, getBoxLiteralValue(value)])
            .filter(([_key, value]) => isNotNullish(value));

        return Object.fromEntries(entries);
    }

    if (box.isList(node)) {
        return node.value.map((value) => getBoxLiteralValue(value)).filter(isNotNullish) as LiteralValue;
    }

    if (box.isConditional(node)) {
        return [node.whenTrue, node.whenFalse]
            .map((value) => getBoxLiteralValue(value))
            .filter(isNotNullish)
            .flat();
    }
};

export const getBoxLiteralValue = (maybeBox: MaybeBoxNodeReturn): LiteralValue | undefined => {
    if (!isNotNullish(maybeBox)) return;
    // logger({ maybeBox });

    if (cacheMap.has(maybeBox)) return cacheMap.get(maybeBox);
    if (Array.isArray(maybeBox)) {
        const values = maybeBox
            .map((valueType) => innerGetLiteralValue(valueType))
            .filter(isNotNullish) as SingleLiteralValue[];
        // logger({ values });

        let result: any = values;
        if (values.length === 0) result = undefined;
        if (values.length === 1) result = values[0];

        cacheMap.set(maybeBox, result);
        return result;
    }

    const result = innerGetLiteralValue(maybeBox);
    cacheMap.set(maybeBox, result);
    return result;
};

export type BoxTraversalControl = {
    /**
     * Stops traversal.
     */
    stop(): void;
    /**
     * Skips traversal of the current node's descendants.
     */
    skip(): void;
    /**
     * Skips traversal of the current node, siblings, and all their descendants.
     */
    up(): void;
};

const logger = createLogger("box-ex:extractor:travesal");

/**
 *
 * @param maybeBox
 * @param cbNode
 * @returns
 *
 * @see adapted from https://github.com/dsherret/ts-morph/blob/latest/packages/ts-morph/src/compiler/ast/common/Node.ts#L692
 */
export const visitBoxNode = <T>(
    maybeBox: BoxNode,
    cbNode: (node: BoxNode, traversal: BoxTraversalControl) => T | undefined,
    cbNodeArray?: (nodes: BoxNode[], traversal: BoxTraversalControl) => T | undefined
): T | undefined => {
    const stopReturnValue: any = {};
    const upReturnValue: any = {};

    let visitedCount = 0;
    let stop = false;
    let up = false;
    const traversal = { stop: () => (stop = true), up: () => (up = true) };

    const nodeCallback: (node: BoxNode) => T | undefined = (node: BoxNode) => {
        logger({ type: node.type, kind: node.getNode().getKindName() });
        if (stop) return stopReturnValue;

        let skip = false;
        const returnValue = cbNode(node, { ...traversal, skip: () => (skip = true) });

        if (returnValue) return returnValue;
        if (stop) return stopReturnValue;
        if (skip || up) return;

        return forEachChildForNode(node);
    };

    const arrayCallback: ((nodes: BoxNode[]) => T | undefined) | undefined =
        cbNodeArray == null
            ? undefined
            : (nodes: BoxNode[]) => {
                  logger({ list: true, stop });
                  if (stop) return stopReturnValue;

                  let skip = false;

                  const returnValue = cbNodeArray(nodes, {
                      ...traversal,
                      skip: () => (skip = true),
                  });

                  if (returnValue) return returnValue;

                  if (skip) return;

                  for (const node of nodes) {
                      if (stop) return stopReturnValue;
                      if (up) return;

                      const innerReturnValue = forEachChildForNode(node);
                      if (innerReturnValue) return innerReturnValue;
                  }
              };

    const finalResult = forEachChildForNode(maybeBox);
    return finalResult === stopReturnValue ? undefined : finalResult;

    function forEachChildForNode(node: BoxNode): T | undefined {
        visitedCount++;
        logger({ visitedCount, type: node.type, kind: node.getNode().getKindName() });

        const getResult = (innerNode: BoxNode | BoxNode[]) => {
            let returnValue: T | undefined | Array<T | undefined>;
            if (Array.isArray(innerNode)) {
                returnValue = arrayCallback ? arrayCallback(innerNode) : innerNode.map(nodeCallback);
            } else {
                returnValue = nodeCallback(innerNode);
            }

            if (up) {
                up = false;
                return returnValue ?? upReturnValue;
            }

            return returnValue;
        };

        if (box.isMap(node) || box.isObject(node)) {
            const asMap = castObjectLikeAsMapValue(node, node.getNode());
            let result: T | undefined;
            asMap.forEach((innerNode) => {
                if (stop) return stopReturnValue;
                if (up) return upReturnValue;

                const current = getResult(innerNode);
                if (current) result = current;
            });
            return result === upReturnValue ? undefined : result;
        }

        if (box.isConditional(node)) {
            const result = getResult(node.whenTrue) || getResult(node.whenFalse);
            return result === upReturnValue ? undefined : result;
        }

        if (box.isList(node)) {
            let result: T | undefined;
            node.value.forEach((innerNode) => {
                if (stop) return stopReturnValue;
                if (up) return upReturnValue;

                const current = getResult(innerNode);
                if (current) result = current;
            });
            return result === upReturnValue ? undefined : result;
        }

        return getResult(node);
    }
};
