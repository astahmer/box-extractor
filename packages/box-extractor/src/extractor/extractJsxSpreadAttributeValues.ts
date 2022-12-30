import type { JsxSpreadAttribute } from "ts-morph";

import { maybeObjectEntries } from "./maybeObjectEntries";
import { emptyObjectType } from "./type-factory";
import { unwrapExpression } from "./utils";

export const extractJsxSpreadAttributeValues = (spreadAttribute: JsxSpreadAttribute) => {
    const node = unwrapExpression(spreadAttribute.getExpression());

    const maybeEntries = maybeObjectEntries(node);
    console.dir({ maybeEntries }, { depth: null });
    if (maybeEntries) return maybeEntries;

    return emptyObjectType;
};
