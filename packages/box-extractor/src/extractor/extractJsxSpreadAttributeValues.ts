import type { JsxSpreadAttribute } from "ts-morph";
import { getLiteralValue } from "./maybeLiteral";

import { maybeObjectEntries } from "./maybeObjectEntries";
import { emptyObjectType } from "./type-factory";
import { isNotNullish, unwrapExpression } from "./utils";

export const extractJsxSpreadAttributeValues = (spreadAttribute: JsxSpreadAttribute) => {
    const node = unwrapExpression(spreadAttribute.getExpression());

    const maybeEntries = maybeObjectEntries(node);
    console.dir({ maybeEntries }, { depth: null });
    // if (isNotNullish(maybeEntries)) return getLiteralValue(maybeEntries);
    if (isNotNullish(maybeEntries)) return getLiteralValue(maybeEntries);

    return emptyObjectType;
};
