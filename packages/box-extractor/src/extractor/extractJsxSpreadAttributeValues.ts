import type { JsxSpreadAttribute } from "ts-morph";

import { emptyObjectType, maybeObjectEntries } from "./maybeObjectEntries";
import { isNotNullish, unwrapExpression } from "./utils";

export const extractJsxSpreadAttributeValues = (spreadAttribute: JsxSpreadAttribute) => {
    const node = unwrapExpression(spreadAttribute.getExpression());

    const maybeEntries = maybeObjectEntries(node);
    if (isNotNullish(maybeEntries)) return maybeEntries;

    return emptyObjectType;
};
