/* eslint-disable @typescript-eslint/naming-convention */
import type { MaybeBoxNodeReturn } from "./maybeBoxNode";
import { box, BoxNode, LiteralValue, SingleLiteralValue } from "./type-factory";
import { isNotNullish } from "./utils";

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

// const logger = createLogger("box-ex:extractor:travesal");

/**
 *
 * @see adapted from https://github.com/dsherret/ts-morph/blob/latest/packages/ts-morph/src/compiler/ast/common/Node.ts#L692
 */
export const visitBoxNode = <T>(
    maybeBox: BoxNode,
    cbNode: (
        node: BoxNode,
        key: string | number | null,
        parent: BoxNode | null,
        traversal: BoxTraversalControl
    ) => T | undefined,
    cbNodeArray?: (
        nodes: BoxNode[],
        key: string | number | null,
        parent: BoxNode | null,
        traversal: BoxTraversalControl
    ) => T | undefined
): T | undefined => {
    const stopReturnValue: any = {};
    const upReturnValue: any = {};

    // let visitedCount = 0;
    let stop = false;
    let up = false;
    const traversal = { stop: () => (stop = true), up: () => (up = true) };

    const nodeCallback: (node: BoxNode, key: string | number | null, parent: BoxNode | null) => T | undefined = (
        node: BoxNode,
        key: string | number | null,
        parent: BoxNode | null
    ) => {
        // logger({ type: node.type, kind: node.getNode().getKindName() });
        if (stop) return stopReturnValue;

        let skip = false;
        const returnValue = cbNode(node, key, parent, Object.assign({}, traversal, { skip: () => (skip = true) }));

        if (returnValue) return returnValue;
        if (stop) return stopReturnValue;
        if (skip || up) return;

        return forEachChildForNode(node, key, parent);
    };

    const arrayCallback:
        | ((nodes: BoxNode[], key: string | number | null, parent: BoxNode | null) => T | undefined)
        | undefined =
        cbNodeArray == null
            ? undefined
            : (nodes: BoxNode[], key: string | number | null, parent: BoxNode | null) => {
                  //   logger({ list: true, stop });
                  if (stop) return stopReturnValue;

                  let skip = false;

                  const returnValue = cbNodeArray(
                      nodes,
                      key,
                      parent,
                      Object.assign({}, traversal, { skip: () => (skip = true) })
                  );

                  if (returnValue) return returnValue;

                  if (skip) return;

                  for (const node of nodes) {
                      if (stop) return stopReturnValue;
                      if (up) return;

                      const innerReturnValue = forEachChildForNode(node, key, parent);
                      if (innerReturnValue) return innerReturnValue;
                  }
              };

    const finalResult = forEachChildForNode(maybeBox, null, null);
    return finalResult === stopReturnValue ? undefined : finalResult;

    function getResult(innerNode: BoxNode | BoxNode[], key: string | number | null, parent: BoxNode | null) {
        let returnValue: T | undefined | Array<T | undefined>;
        if (Array.isArray(innerNode)) {
            returnValue = arrayCallback
                ? arrayCallback(innerNode, key, parent)
                : innerNode.map((n) => nodeCallback(n, key, parent));
        } else {
            returnValue = nodeCallback(innerNode, key, parent);
        }

        if (up) {
            up = false;
            return returnValue ?? upReturnValue;
        }

        return returnValue;
    }

    function forEachChildForNode(node: BoxNode, key: string | number | null, parent: BoxNode | null): T | undefined {
        // visitedCount++;
        // logger({ visitedCount, type: node.type, kind: node.getNode().getKindName() });

        if (box.isMap(node)) {
            let result: T | undefined;

            for (const [key, innerNode] of node.value) {
                if (stop) return stopReturnValue;
                if (up) return upReturnValue;

                const current = getResult(innerNode, key, node);
                if (current) result = current;
            }

            return result === upReturnValue ? undefined : result;
        }

        if (box.isList(node)) {
            let result: T | undefined;

            for (let index = 0; index < node.value.length; index++) {
                if (stop) return stopReturnValue;
                if (up) return upReturnValue;

                const current = getResult(node.value[index]!, index, node);
                if (current) result = current;
            }

            return result === upReturnValue ? undefined : result;
        }

        if (box.isConditional(node)) {
            const result = getResult(node.whenTrue, "whenTrue", node) || getResult(node.whenFalse, "whenFalse", node);
            return result === upReturnValue ? undefined : result;
        }

        return getResult(node, key, parent);
    }
};

export const unbox = (rootNode: BoxNode, localCacheMap: WeakMap<BoxNode, unknown> = cacheMap) => {
    if (rootNode.isUnresolvable()) return;
    if (rootNode.isConditional()) return;
    if (rootNode.isEmptyInitializer()) return;
    if (rootNode.isObject()) return rootNode.value;
    if (rootNode.isLiteral()) return rootNode.value;

    const reconstructed = rootNode.isMap() ? {} : [];
    const pathByNode = new WeakMap<BoxNode, string[]>();
    let parent = reconstructed as any;
    let prevParent = null as any;

    // TODO return infos like: has circular ? has unresolvable ? has conditional ? has empty initializer ?
    visitBoxNode(rootNode, (node, key, parentNode, traversal) => {
        if (node.isUnresolvable() || node.isConditional() || node.isEmptyInitializer()) {
            traversal.skip();
            return;
        }

        if (localCacheMap.has(node)) {
            if (parentNode) {
                const parentPath = pathByNode.get(parentNode) ?? [];
                prevParent = parentNode;
                parent = parentPath.reduce((o, i) => (o as any)[i], reconstructed);

                parent[key!] = localCacheMap.get(node);
            }

            traversal.skip();
            return;
        }

        let current: LiteralValue;
        if (node.isObject()) {
            current = node.value;
            traversal.skip();
        } else if (node.isMap()) {
            current = {};
        } else if (node.isList()) {
            current = [];
        } else if (node.isLiteral()) {
            current = node.value;
        }

        if (parentNode && parentNode !== prevParent) {
            const parentPath = pathByNode.get(parentNode) ?? [];
            prevParent = parentNode;
            parent = parentPath.reduce((o, i) => (o as any)[i], reconstructed);
        }

        parent[key!] = current;
        if (parentNode && !pathByNode.has(node)) {
            const parentPath = pathByNode.get(parentNode) ?? [];
            pathByNode.set(node, [...parentPath, key as string]);
            // console.log({ parentPath });
        }

        localCacheMap.set(node, current);
    });

    return reconstructed;
};
