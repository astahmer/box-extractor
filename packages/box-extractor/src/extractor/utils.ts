import { JsxOpeningElement, JsxSelfClosingElement, Node } from "ts-morph";

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

export const unquote = (str: string) => {
    if (str.startsWith('"') && str.endsWith('"')) return str.slice(1, -1);
    if (str.startsWith("'") && str.endsWith("'")) return str.slice(1, -1);
    return str;
};

export const getComponentName = (node: JsxOpeningElement | JsxSelfClosingElement) => {
    const tagNameNode = node.getTagNameNode();
    if (Node.isPropertyAccessExpression(tagNameNode)) {
        return tagNameNode.getText();
    }

    return tagNameNode.getText();
};

const whitespaceRegex = /\s+/g;
export const trimWhitespace = (str: string) => {
    // @ts-expect-error
    return str.replaceAll(whitespaceRegex, " ");
};
