import { Node } from "ts-morph";
import type { Extractable, ExtractableMap } from "./types";

type Nullable<T> = T | null | undefined;

export const isNotNullish = <T>(element: Nullable<T>): element is T => element != null;

export const unwrapExpression = (node: Node): Node => {
    if (Node.isAsExpression(node)) {
        return unwrapExpression(node.getExpression());
    }

    if (Node.isParenthesizedExpression(node)) {
        return unwrapExpression(node.getExpression());
    }

    if (Node.isNonNullExpression(node)) {
        return unwrapExpression(node.getExpression());
    }

    if (Node.isTypeAssertion(node)) {
        return unwrapExpression(node.getExpression());
    }

    return node;
};

export const unwrapArray = <T>(array: T[]): T | T[] => {
    if (array.length === 1) {
        return array[0]!;
    }

    return array;
};

export const castAsExtractableMap = (extractable: Extractable) => {
    return Array.isArray(extractable)
        ? (Object.fromEntries(extractable.map((name) => [name, { properties: "all" }])) as ExtractableMap)
        : extractable;
};

export const unquote = (str: string) => {
    if (str.startsWith('"') && str.endsWith('"')) return str.slice(1, -1);
    if (str.startsWith("'") && str.endsWith("'")) return str.slice(1, -1);
    return str;
};
