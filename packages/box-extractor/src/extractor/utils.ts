import type { Type } from "ts-morph";
import { Node } from "ts-morph";

type Nullable<T> = T | null | undefined;

export const isNotNullish = <T>(element: Nullable<T>): element is T => element != null;

const UnknownType = Symbol("Unknown");
const innerParseType = (type: Type): string | string[] | undefined | typeof UnknownType => {
    if (type.isUnion() && type.getUnionTypes().map(innerParseType).includes(UnknownType)) return undefined;

    if (type.isLiteral()) {
        const text = type.getText().replace(/["']/g, "").split(" | ");
        return text.length > 1 ? text : text[0];
    }

    return UnknownType;
};

export const parseType = (type: Type): string | string[] | undefined => {
    const parsed = innerParseType(type);
    if (parsed === UnknownType) return undefined;
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
