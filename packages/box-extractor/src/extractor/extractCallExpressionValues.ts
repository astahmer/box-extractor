import { createLogger } from "@box-extractor/logger";
import type { CallExpression, Node } from "ts-morph";
import { maybeBoxNode } from "./maybeBoxNode";

import { maybeObjectLikeBox } from "./maybeObjectLikeBox";
import { box } from "./type-factory";
import type { ListOrAll } from "./types";
import { isNotNullish, unwrapExpression } from "./utils";

const logger = createLogger("box-ex:extractor:call-expr");

export const extractCallExpressionValues = (node: CallExpression, properties: ListOrAll) => {
    const argList = node.getArguments();
    if (argList.length === 0) return box.list([], node, []);

    const boxes = argList
        .map((arg) => {
            const argNode = unwrapExpression(arg);
            if (!argNode) return;

            const stack = [node, argNode] as Node[];

            const maybeValue = maybeBoxNode(argNode, stack);
            logger({ extractCallExpression: true, maybeValue });
            // !maybeValue && console.log("maybeBoxNode empty", expression.getKindName(), expression.getText());
            if (maybeValue) {
                return maybeValue;
            }

            const maybeObject = maybeObjectLikeBox(argNode, stack, properties);
            logger({ maybeObject });
            // console.log("expr", expression.getKindName(), expression.getText());
            if (maybeObject) return maybeObject;
        })
        .filter(isNotNullish);

    if (boxes.length === 0) return;
    if (boxes.length === 1) return boxes[0]!;

    return boxes;
};
