import type { JsxSpreadAttribute } from "ts-morph";
import { isNotNullish, unwrapExpression } from "./utils";
import { maybeObjectEntries } from "./maybeObjectEntries";

export const extractJsxSpreadAttributeValues = (spreadAttribute: JsxSpreadAttribute) => {
    const node = unwrapExpression(spreadAttribute.getExpression());

    const maybeEntries = maybeObjectEntries(node);
    if (isNotNullish(maybeEntries)) return maybeEntries;

    return [];
};
