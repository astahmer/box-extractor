import { createLogger } from "@box-extractor/logger";
import type { JsxAttribute } from "ts-morph";
import { Node } from "ts-morph";

import { maybeBoxNode } from "./maybeBoxNode";
import { maybeObjectLikeBox } from "./maybeObjectLikeBox";
import { box } from "./type-factory";
import type { BoxContext } from "./types";
import { trimWhitespace, unwrapExpression } from "./utils";

const logger = createLogger("box-ex:extractor:jsx-attr");

export const extractJsxAttribute = (jsxAttribute: JsxAttribute, ctx: BoxContext) => {
    // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
    //           ^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // identifier = `color` (and then backgroundColor)
    // parent = `color="red.200"` (and then backgroundColor="blackAlpha.100")

    const initializer = jsxAttribute.getInitializer();
    const stack = [jsxAttribute, initializer] as Node[];
    if (!initializer) return box.emptyInitializer(jsxAttribute.getNameNode(), stack);

    if (Node.isStringLiteral(initializer)) {
        // initializer = `"red.200"` (and then "blackAlpha.100")
        return box.literal(trimWhitespace(initializer.getLiteralText()), initializer, stack);
    }

    // <ColorBox color={xxx} />
    if (Node.isJsxExpression(initializer)) {
        const expr = initializer.getExpression();
        if (!expr) return;

        const expression = unwrapExpression(expr);
        if (!expression) return;

        stack.push(expression);
        const maybeValue = maybeBoxNode(expression, stack, ctx);
        logger({ extractJsx: true, maybeValue });
        // !maybeValue && console.log("maybeBoxNode empty", expression.getKindName(), expression.getText());
        if (maybeValue) {
            return maybeValue;
        }

        const maybeObject = maybeObjectLikeBox(expression, stack, ctx);
        logger({ maybeObject });
        // console.log("expr", expression.getKindName(), expression.getText());
        if (maybeObject) return maybeObject;
    }
};
