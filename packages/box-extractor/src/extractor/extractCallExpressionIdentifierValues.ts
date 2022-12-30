import type { CallExpression } from "ts-morph";

import { maybeObjectLikeBox } from "./maybeObjectLikeBox";
import { isNotNullish, unwrapExpression } from "./utils";

export const extractCallExpressionValues = (node: CallExpression) => {
    const arg = node.getArguments()[0];
    if (!arg) return;

    const maybeObjectNode = unwrapExpression(arg);
    const maybeEntries = maybeObjectLikeBox(maybeObjectNode);
    if (isNotNullish(maybeEntries)) return maybeEntries;
};
