import { Node, Type } from "ts-morph";

type Nullable<T> = T | null | undefined;

export const isNotNullish = <T>(element: Nullable<T>): element is T => element != null;

export const parseType = (type: Type) => {
    const text = type.getText().replace(/["']/g, "").split(" | ");
    return text.length > 1 ? text : text[0];
};

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
