import type { Identifier } from "ts-morph";
import { Node } from "ts-morph";
import { diary } from "./debug-logger";

import { maybeLiteral } from "./maybeLiteral";
import { maybeObjectEntries } from "./maybeObjectEntries";
import { box } from "./type-factory";
import { isNotNullish, unwrapExpression } from "./utils";

const logger = diary("box-ex:extractor:jsx-attr");

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
        return box.literal(initializer.getLiteralText());
    }

    // <ColorBox color={xxx} />
    if (Node.isJsxExpression(initializer)) {
        const expression = unwrapExpression(initializer.getExpressionOrThrow());
        if (!expression) return;

        // expression.getKindName() === "ObjectLiteralExpression"
        // = defineProperties.conditions
        const maybeValue = maybeLiteral(expression);
        logger(() => ({ extractJsx: true, maybeValue }));
        // !maybeValue && console.log("maybeLiteral empty", expression.getKindName(), expression.getText());
        if (isNotNullish(maybeValue)) return maybeValue;

        const maybeObject = maybeObjectEntries(expression);
        logger(() => ({ maybeObject }));
        // console.log("expr", expression.getKindName(), expression.getText());
        if (isNotNullish(maybeObject)) return maybeObject;
    }
};
