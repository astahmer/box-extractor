import { Identifier, Node } from "ts-morph";
import { maybeLiteral } from "./maybeLiteral";
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

        // console.log("expr", expression.getKindName(), expression.getText());
        // expression.getKindName() === "ObjectLiteralExpression"
        // = defineProperties.conditions
        const maybeValue = maybeLiteral(expression);
        if (isNotNullish(maybeValue)) return maybeValue;

        const type = expression.getType();
        if (type.isLiteral() || type.isUnionOrIntersection()) return parseType(type);

        // unresolvable condition (isDark) will return both possible outcome
        // const [isDark, setIsDark] = useColorMode();
        // <ColorBox color={isDark ? darkValue : "whiteAlpha.100"} />
        if (Node.isConditionalExpression(expression)) {
            return [maybeLiteral(expression.getWhenTrue()), maybeLiteral(expression.getWhenFalse())].flat();
        }
    }
};
