import { createLogger } from "@box-extractor/logger";
import type { CallExpression, Node } from "ts-morph";
import { maybeBoxNode } from "./maybeBoxNode";

import { maybeObjectLikeBox } from "./maybeObjectLikeBox";
import { box } from "./type-factory";
import type { MatchFnPropArgs } from "./types";
import { isNotNullish, unwrapExpression } from "./utils";

const logger = createLogger("box-ex:extractor:call-expr");

export const extractCallExpressionValues = (node: CallExpression, matchProp: (prop: MatchFnPropArgs) => boolean) => {
    const argList = node.getArguments();
    if (argList.length === 0) return box.list([], node, []);

    const boxes = argList
        .map((arg) => {
            const argNode = unwrapExpression(arg);
            if (!argNode) return;

            const stack = [node, argNode] as Node[];

            const maybeValue = maybeBoxNode(argNode, stack);
            logger({ extractCallExpression: true, maybeValue });
            if (maybeValue) {
                return maybeValue;
            }

            const maybeObject = maybeObjectLikeBox(argNode, stack, matchProp);
            logger({ maybeObject });
            if (maybeObject) return maybeObject;
        })
        .filter(isNotNullish);

    // TODO box.function
    if (boxes.length === 0) return;
    if (boxes.length === 1) return boxes[0]!;

    return boxes;
};
