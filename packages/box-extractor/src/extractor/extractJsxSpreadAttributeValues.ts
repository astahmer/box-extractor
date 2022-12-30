import type { JsxSpreadAttribute } from "ts-morph";
import { diary } from "./debug-logger";

import { maybeObjectLikeBox } from "./maybeObjectLikeBox";
import { emptyObjectType } from "./type-factory";
import { unwrapExpression } from "./utils";

const logger = diary("box-ex:extractor:jsx-spread");

export const extractJsxSpreadAttributeValues = (spreadAttribute: JsxSpreadAttribute) => {
    const node = unwrapExpression(spreadAttribute.getExpression());

    const maybeEntries = maybeObjectLikeBox(node);
    logger(() => ({ maybeEntries }));
    if (maybeEntries) return maybeEntries;

    return emptyObjectType;
};
