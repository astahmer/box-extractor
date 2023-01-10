import type { JsxSpreadAttribute } from "ts-morph";
import { createLogger } from "@box-extractor/logger";

import { maybeObjectLikeBox } from "./maybeObjectLikeBox";
import { box } from "./type-factory";
import { unwrapExpression } from "./utils";

const logger = createLogger("box-ex:extractor:jsx-spread");

export const extractJsxSpreadAttributeValues = (spreadAttribute: JsxSpreadAttribute) => {
    const node = unwrapExpression(spreadAttribute.getExpression());

    const maybeEntries = maybeObjectLikeBox(node);
    logger({ maybeEntries });
    if (maybeEntries) return maybeEntries;

    return box.empty(node);
};
