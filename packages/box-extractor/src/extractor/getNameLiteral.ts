import { createLogger } from "@box-extractor/logger";
import { Node } from "ts-morph";
// eslint-disable-next-line import/no-cycle
import { getIdentifierReferenceValue } from "./maybeBoxNode";

const logger = createLogger("box-ex:extractor:name");

export function getNameLiteral(wrapper: Node) {
    logger({ name: wrapper.getText(), kind: wrapper.getKindName() });
    if (Node.isStringLiteral(wrapper)) return wrapper.getLiteralText();
    if (Node.isIdentifier(wrapper)) {
        const maybeValue = getIdentifierReferenceValue(wrapper);
        logger({ maybeValue });
        if (!maybeValue) return wrapper.getText();

        if (typeof maybeValue === "string") return maybeValue;
        if (typeof maybeValue === "number") return maybeValue.toString();
        if (typeof maybeValue === "boolean") return maybeValue.toString();
        if (typeof maybeValue === "object" && maybeValue === null) return "null";

        return wrapper.getText();
    }

    return wrapper.getText();
}

export const unquote = (str: string) => {
    if (str.startsWith('"') && str.endsWith('"')) return str.slice(1, -1);
    if (str.startsWith("'") && str.endsWith("'")) return str.slice(1, -1);
    return str;
};
