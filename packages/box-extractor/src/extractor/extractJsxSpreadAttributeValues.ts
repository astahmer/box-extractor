import type { JsxSpreadAttribute, Node } from "ts-morph";
import { createLogger } from "@box-extractor/logger";

import { maybeObjectLikeBox } from "./maybeObjectLikeBox";
import { box } from "./type-factory";
import { unwrapExpression } from "./utils";

const logger = createLogger("box-ex:extractor:jsx-spread");

export const extractJsxSpreadAttributeValues = (spreadAttribute: JsxSpreadAttribute) => {
    const node = unwrapExpression(spreadAttribute.getExpression());

    const stack = [] as Node[];
    const maybeEntries = maybeObjectLikeBox(node, stack);
    logger({ maybeEntries });
    if (maybeEntries) return maybeEntries;

    return box.emptyObject(node, stack);
};
