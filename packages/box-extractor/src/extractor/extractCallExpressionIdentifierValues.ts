import { createLogger } from "@box-extractor/logger";
import type { CallExpression } from "ts-morph";

import { maybeObjectLikeBox } from "./maybeObjectLikeBox";
import { isNotNullish, unwrapExpression } from "./utils";

const logger = createLogger("box-ex:extractor:call-expr");

export const extractCallExpressionValues = (node: CallExpression) => {
    const arg = node.getArguments()[0];
    if (!arg) return;

    const maybeObjectNode = unwrapExpression(arg);
    const maybeEntries = maybeObjectLikeBox(maybeObjectNode);
    logger({ maybeEntries });
    if (isNotNullish(maybeEntries)) return maybeEntries;
};
