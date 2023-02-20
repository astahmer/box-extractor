import { createLogger } from "@box-extractor/logger";
import type { CallExpression, Node } from "ts-morph";
import { maybeBoxNode } from "./maybeBoxNode";

import { maybeObjectLikeBox } from "./maybeObjectLikeBox";
import { isNotNullish, unwrapExpression } from "./utils";

const logger = createLogger("box-ex:extractor:call-expr");

// TODO rename file
export const extractCallExpressionValues = (node: CallExpression) => {
    const argList = node.getArguments();
    // TODO also return a BoxNode (with a isEmpty: true ? flag or kind: "empty" ) when no arguments provided ?
    // needed for `const css = defineProperties()`
    if (argList.length === 0) return;

    const boxes = argList
        .map((arg) => {
            const argNode = unwrapExpression(arg);
            if (!argNode) return;

            const stack = [node, argNode] as Node[];

            const maybeValue = maybeBoxNode(argNode, stack);
            logger({ extractCallExpression: true, maybeValue });
            // !maybeValue && console.log("maybeBoxNode empty", expression.getKindName(), expression.getText());
            if (maybeValue) {
                if (Array.isArray(maybeValue)) {
                    throw new TypeError("unexpected array");
                }

                return maybeValue;
            }

            const maybeObject = maybeObjectLikeBox(argNode, stack);
            logger({ maybeObject });
            // console.log("expr", expression.getKindName(), expression.getText());
            if (maybeObject) return maybeObject;
        })
        .filter(isNotNullish);

    if (boxes.length === 0) return;
    if (boxes.length === 1) return boxes[0]!;

    return boxes;
};
