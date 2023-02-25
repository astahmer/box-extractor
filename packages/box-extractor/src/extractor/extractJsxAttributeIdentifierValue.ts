import type { Identifier } from "ts-morph";
import { Node } from "ts-morph";
import { createLogger } from "@box-extractor/logger";

import { maybeBoxNode } from "./maybeBoxNode";
import { maybeObjectLikeBox } from "./maybeObjectLikeBox";
import { box } from "./type-factory";
import { isNotNullish, unwrapExpression } from "./utils";

const logger = createLogger("box-ex:extractor:jsx-attr");

export const extractJsxAttributeIdentifierValue = (identifier: Identifier) => {
    // console.log(n.getText(), n.parent.getText());
    const parent = identifier.getParent();
    if (!Node.isJsxAttribute(parent)) return;
    // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
    //           ^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // identifier = `color` (and then backgroundColor)
    // parent = `color="red.200"` (and then backgroundColor="blackAlpha.100")

    const initializer = parent.getInitializer();
    const stack = [parent, initializer] as Node[];
    if (!initializer) return box.emptyInitializer(identifier, stack);

    if (Node.isStringLiteral(initializer)) {
        // initializer = `"red.200"` (and then "blackAlpha.100")
        return box.literal(initializer.getLiteralText(), initializer, stack);
    }

    // <ColorBox color={xxx} />
    if (Node.isJsxExpression(initializer)) {
        const expr = initializer.getExpression();
        if (!expr) return;

        const expression = unwrapExpression(expr);
        if (!expression) return;

        stack.push(expression);
        const maybeValue = maybeBoxNode(expression, stack);
        logger({ extractJsx: true, maybeValue });
        // !maybeValue && console.log("maybeBoxNode empty", expression.getKindName(), expression.getText());
        if (maybeValue) {
            return maybeValue;
        }

        const maybeObject = maybeObjectLikeBox(expression, stack);
        logger({ maybeObject });
        // console.log("expr", expression.getKindName(), expression.getText());
        if (maybeObject) return maybeObject;
    }
};
