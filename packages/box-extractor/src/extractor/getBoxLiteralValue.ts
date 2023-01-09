/* eslint-disable @typescript-eslint/naming-convention */
import {
    BoxNode,
    isPrimitiveType,
    LiteralValue,
    narrowCondionalType,
    NodeObjectLiteralExpressionType,
    SingleLiteralValue,
} from "./type-factory";
import type { PrimitiveType } from "./types";
import { isNotNullish } from "./utils";
import type { MaybeBoxNodeReturn } from "./maybeBoxNode";
import { createLogger } from "@box-extractor/logger";

const logger = createLogger("box-ex:extractor:get-literal");

const innerGetLiteralValue = (
    valueType: PrimitiveType | BoxNode | NodeObjectLiteralExpressionType | undefined
): LiteralValue | undefined => {
    if (!valueType) return;
    if (isPrimitiveType(valueType)) return valueType;
    if (valueType.type === "literal") return valueType.value;
    if (valueType.type === "node-object-literal" || valueType.type === "unresolvable") return;

    if (valueType.type === "object") {
        if (valueType.isEmpty) return;
        return valueType.value;
    }

    if (valueType.type === "map") {
        const entries = Array.from(valueType.value.entries())
            .map(([key, value]) => [key, getBoxLiteralValue(value)])
            .filter(([_key, value]) => isNotNullish(value));

        return Object.fromEntries(entries);
    }

    if (valueType.type === "list") {
        return valueType.value.map((value) => getBoxLiteralValue(value)).filter(isNotNullish) as LiteralValue;
    }

    if (valueType.type === "conditional") {
        const narrowed = narrowCondionalType(valueType);
        logger.scoped("narrow", { valueType, narrowed });

        if (narrowed.length === 1) {
            return getBoxLiteralValue(narrowed[0]);
        }

        return narrowed
            .map((value) => getBoxLiteralValue(value))
            .filter(isNotNullish)
            .flat();
    }
};

export const getBoxLiteralValue = (maybeBox: MaybeBoxNodeReturn): LiteralValue | undefined => {
    if (!isNotNullish(maybeBox)) return;
    logger({ maybeBox });

    if (Array.isArray(maybeBox)) {
        const values = maybeBox
            .map((valueType) => innerGetLiteralValue(valueType))
            .filter(isNotNullish) as SingleLiteralValue[];
        logger({ values });

        if (values.length === 0) return;
        if (values.length === 1) return values[0];

        return values;
    }

    return innerGetLiteralValue(maybeBox);
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
    cbNode: (node: BoxNode, traversal?: BoxTraversalControl) => T | undefined,
    cbNodeArray?: (nodes: BoxNode[], traversal?: BoxTraversalControl) => T | undefined
): T | undefined => {
    const stopReturnValue: any = {};
    const upReturnValue: any = {};

    let stop = false;
    let up = false;
    const traversal = { stop: () => (stop = true), up: () => (up = true) };

    const nodeCallback: (node: BoxNode) => T | undefined = (node: BoxNode) => {
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

    return forEachChildForNode(maybeBox);

    function forEachChildForNode(node: BoxNode): T | undefined {
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

        if (node.type === "map") {
            let result: T | undefined;
            node.value.forEach((innerNode) => {
                if (stop) return stopReturnValue;
                if (up) return upReturnValue;

                const current = getResult(innerNode);
                if (current) result = current;
            });
            return result === upReturnValue ? undefined : result;
        }

        if (node.type === "conditional") {
            const result = getResult(node.whenTrue) || getResult(node.whenFalse);
            return result === upReturnValue ? undefined : result;
        }
    }
};
