import { createLogger } from "@box-extractor/logger";
import { Node } from "ts-morph";
// eslint-disable-next-line import/no-cycle
import { getIdentifierReferenceValue } from "./maybeBoxNode";
import { box } from "./type-factory";
import { isNotNullish } from "./utils";

const logger = createLogger("box-ex:extractor:name");

export function getNameLiteral(wrapper: Node, stack: Node[]) {
    logger({ name: wrapper.getText(), kind: wrapper.getKindName() });
    if (Node.isStringLiteral(wrapper)) return wrapper.getLiteralText();
    if (Node.isIdentifier(wrapper)) {
        const boxed = getIdentifierReferenceValue(wrapper, stack);
        logger({ maybeValue: boxed });
        if (!boxed) return wrapper.getText();
        if (Array.isArray(boxed)) return;

        if (!box.isLiteral(boxed)) return;
        if (!isNotNullish(boxed.value)) return;
        return boxed.value.toString();
    }

    return wrapper.getText();
}

export const unquote = (str: string) => {
    if (str.startsWith('"') && str.endsWith('"')) return str.slice(1, -1);
    if (str.startsWith("'") && str.endsWith("'")) return str.slice(1, -1);
    return str;
};
