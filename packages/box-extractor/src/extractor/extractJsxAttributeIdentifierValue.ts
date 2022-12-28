import debug from "debug";
import type { Identifier } from "ts-morph";
import { Node } from "ts-morph";

import { maybeLiteral } from "./maybeLiteral";
import { maybeObjectEntries } from "./maybeObjectEntries";
import { isNotNullish, unwrapExpression } from "./utils";

const logger = debug("box-ex:extractor:jsx-attr");

export const extractJsxAttributeIdentifierValue = (identifier: Identifier) => {
    const parent = identifier.getParent();
    if (!Node.isJsxAttribute(parent)) return;
    // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
    //           ^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // identifier = `color` (and then backgroundColor)
    // parent = `color="red.200"` (and then backgroundColor="blackAlpha.100")
    const initializer = parent.getInitializer();
    if (!initializer) return;

    const propName = identifier.getText();
    logger({ propName, initializer: initializer.getText() });

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
        logger("maybeValue:", maybeValue);
        if (isNotNullish(maybeValue)) return maybeValue;

        const maybeObject = maybeObjectEntries(expression);
        logger("maybeObject:", maybeObject);
        // console.log("expr", expression.getKindName(), expression.getText());
        if (isNotNullish(maybeObject) && maybeObject.length > 0) return Object.fromEntries(maybeObject);
    }
};
