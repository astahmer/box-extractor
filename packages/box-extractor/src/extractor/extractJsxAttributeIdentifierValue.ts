import type { Identifier } from "ts-morph";
import { Node } from "ts-morph";

import { maybeLiteral } from "./maybeLiteral";
import { maybeObjectEntries } from "./maybeObjectEntries";
import { isNotNullish, parseType, unwrapExpression } from "./utils";

export const extractJsxAttributeIdentifierValue = (identifier: Identifier) => {
    // console.log(n.getText(), n.parent.getText());
    const parent = identifier.getParent();
    if (!Node.isJsxAttribute(parent)) return;
    // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
    //           ^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // identifier = `color` (and then backgroundColor)
    // parent = `color="red.200"` (and then backgroundColor="blackAlpha.100")
    const initializer = parent.getInitializer();
    if (!initializer) return;

    if (Node.isStringLiteral(initializer)) {
        // initializer = `"red.200"` (and then "blackAlpha.100")
        return initializer.getLiteralText();
    }

    // <ColorBox color={xxx} />
    if (Node.isJsxExpression(initializer)) {
        const expression = unwrapExpression(initializer.getExpressionOrThrow());
        if (!expression) return;

        // expression.getKindName() === "ObjectLiteralExpression"
        // = defineProperties.conditions
        const maybeValue = maybeLiteral(expression);
        if (isNotNullish(maybeValue)) return maybeValue;

        const maybeType = parseType(expression.getType());
        if (isNotNullish(maybeType)) return maybeType;

        const maybeObject = maybeObjectEntries(expression);
        // console.dir({ maybeObject }, { depth: null });
        // console.log("expr", expression.getKindName(), expression.getText());
        if (isNotNullish(maybeObject) && maybeObject.length > 0) return Object.fromEntries(maybeObject);
    }
};