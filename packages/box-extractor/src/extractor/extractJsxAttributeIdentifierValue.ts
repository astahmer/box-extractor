import type { Identifier } from "ts-morph";
import { Node } from "ts-morph";

import { getLiteralValue, maybeLiteral } from "./maybeLiteral";
import { maybeObjectEntries } from "./maybeObjectEntries";
import { isNotNullish, unwrapExpression } from "./utils";

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
        console.dir({ extractJsx: true, maybeValue }, { depth: null });
        !maybeValue && console.log("maybeLiteral", expression.getKindName(), expression.getText());
        if (isNotNullish(maybeValue)) {
            return getLiteralValue(maybeValue);
            // if (typeof maybeValue === "string") {
            //     return maybeValue;
            // }

            // if (Array.isArray(maybeValue)) {
            //     return maybeValue.map((valueType) => {
            //         if (typeof valueType === "string") return valueType;
            //         if (valueType.type === "literal") return valueType.value;
            //         if (valueType.type === "object") return valueType.value;
            //         if (valueType.type === "map") return Object.fromEntries(valueType.value.entries());
            //     });
            // }
        }

        const maybeObject = maybeObjectEntries(expression);
        console.dir({ maybeObject }, { depth: null });
        // console.log("expr", expression.getKindName(), expression.getText());
        if (isNotNullish(maybeObject)) return getLiteralValue(maybeObject);
        // return maybeObject.type === "object" ? maybeObject.value : Object.fromEntries(maybeObject.value.entries());
    }
};
