import { createLogger } from "@box-extractor/logger";
import type { CallExpression, Node } from "ts-morph";

import { maybeObjectLikeBox } from "./maybeObjectLikeBox";
import { isNotNullish, unwrapExpression } from "./utils";

const logger = createLogger("box-ex:extractor:call-expr");

export const extractCallExpressionValues = (node: CallExpression) => {
    const arg = node.getArguments()[0];
    if (!arg) return;

    const stack = [] as Node[];
    const maybeObjectNode = unwrapExpression(arg);
    stack.push(maybeObjectNode);

    const maybeEntries = maybeObjectLikeBox(maybeObjectNode, stack);
    logger({ maybeEntries });
    if (isNotNullish(maybeEntries)) return maybeEntries;
};
