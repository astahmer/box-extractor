import type { JsxSpreadAttribute, Node } from "ts-morph";
import { createLogger } from "@box-extractor/logger";

import { maybeObjectLikeBox } from "./maybeObjectLikeBox";
import { box } from "./type-factory";
import { unwrapExpression } from "./utils";
import { maybeBoxNode } from "./maybeBoxNode";
import type { ListOrAll } from "./types";

const logger = createLogger("box-ex:extractor:jsx-spread");

export const extractJsxSpreadAttributeValues = (spreadAttribute: JsxSpreadAttribute, properties: ListOrAll) => {
    const node = unwrapExpression(spreadAttribute.getExpression());
    logger.scoped("extractJsxSpreadAttributeValues", { node: node.getKindName() });

    const stack = [] as Node[];
    const maybeValue = maybeBoxNode(node, stack);
    if (
        maybeValue &&
        (maybeValue.isMap() || maybeValue.isObject() || maybeValue.isUnresolvable() || maybeValue.isConditional())
    ) {
        return maybeValue;
    }

    const maybeEntries = maybeObjectLikeBox(node, stack, properties);
    logger({ maybeEntries });
    if (maybeEntries) return maybeEntries;

    // TODO unresolvable ?
    return box.emptyObject(node, stack);
};
