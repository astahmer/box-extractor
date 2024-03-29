import { createLogger } from "@box-extractor/logger";
import type { JsxSpreadAttribute, Node } from "ts-morph";

import { maybeBoxNode } from "./maybeBoxNode";
import { maybeObjectLikeBox } from "./maybeObjectLikeBox";
import { box } from "./type-factory";
import type { BoxContext, MatchFnPropArgs, MatchPropArgs } from "./types";
import { unwrapExpression } from "./utils";

const logger = createLogger("box-ex:extractor:jsx-spread");

export const extractJsxSpreadAttributeValues = (
    spreadAttribute: JsxSpreadAttribute,
    ctx: BoxContext,
    matchProp: (prop: MatchFnPropArgs | MatchPropArgs) => boolean
) => {
    const node = unwrapExpression(spreadAttribute.getExpression());
    logger.scoped("extractJsxSpreadAttributeValues", { node: node.getKindName() });

    const stack = [] as Node[];
    const maybeValue = maybeBoxNode(node, stack, ctx);
    if (maybeValue) {
        if (maybeValue.isMap() || maybeValue.isObject() || maybeValue.isUnresolvable() || maybeValue.isConditional()) {
            return maybeValue;
        }

        if (maybeValue.isLiteral() && (maybeValue.kind == "null" || maybeValue.kind == "undefined")) {
            return maybeValue;
        }
    }

    const maybeEntries = maybeObjectLikeBox(node, stack, ctx, matchProp);
    logger({ maybeEntries });
    if (maybeEntries) return maybeEntries;

    // TODO unresolvable ?
    return box.emptyObject(node, stack);
};
