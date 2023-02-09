import { Node } from "ts-morph";
import type MagicString from "magic-string";
import type { generateStyleFromExtraction } from "./jit";

export function transformStyleNodes(
    generateStyleResults: Set<ReturnType<typeof generateStyleFromExtraction>>,
    magicStr: MagicString
) {
    generateStyleResults.forEach((result) => {
        result.toRemove.forEach((node) => {
            if (node.wasForgotten()) return;

            // TODO only remove the props needed rather than the whole spread, this is a bit too aggressive
            // if (Node.isJsxSpreadAttribute(node)) {
            // also, remove the spread if it's empty
            // // console.time("usage:component:remove2");
            // magicStr.update(node.getPos(), node.getEnd(), "");
            // // console.timeEnd("usage:component:remove2");
            // }
            // console.log({
            //     text: node.getText(),
            //     pos: node.getPos(),
            //     end: node.getEnd(),
            //     at: magicStr.toString().slice(node.getPos(), node.getEnd()),
            // });
            magicStr.update(node.getPos(), node.getEnd(), "");
        });
        result.toReplace.forEach((className, node) => {
            // console.log({ node: node.getText(), kind: node.getKindName(), className });
            if (Node.isCallExpression(node)) {
                magicStr.update(node.getStart(), node.getEnd(), `"${className}"`);
                return;
            }

            if (
                (Node.isJsxSelfClosingElement(node) || Node.isJsxOpeningElement(node)) &&
                !node.getAttribute("_styled")
            ) {
                const tagName = node.getTagNameNode();
                magicStr.appendLeft(tagName.getEnd(), ` _styled="${className}"`);
            }
        });
    });
}
