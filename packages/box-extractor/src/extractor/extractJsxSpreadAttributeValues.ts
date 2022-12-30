import type { JsxSpreadAttribute } from "ts-morph";
import { diary } from "./debug-logger";

import { maybeObjectEntries } from "./maybeObjectEntries";
import { emptyObjectType } from "./type-factory";
import { unwrapExpression } from "./utils";

const logger = diary("box-ex:extractor:jsx-spread");

export const extractJsxSpreadAttributeValues = (spreadAttribute: JsxSpreadAttribute) => {
    const node = unwrapExpression(spreadAttribute.getExpression());

    const maybeEntries = maybeObjectEntries(node);
    logger(() => ({ maybeEntries }));
    if (maybeEntries) return maybeEntries;

    return emptyObjectType;
};
