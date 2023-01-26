import { getBoxLiteralValue, PropNodesMap } from "@box-extractor/core";
import { style } from "@vanilla-extract/css";
import { isPrimitive } from "pastable";
import type { Node } from "ts-morph";
import type { GenericPropsConfig } from "./defineProperties";

// config: GenericPropsConfig
export function generateStyleFromExtraction(name: string, extracted: PropNodesMap) {
    const toErase = new Set<Node>();
    const toReplace = new Map<Node, string>();
    const classMap = new Map<string, string>();

    extracted.nodesByProp.forEach((nodeList, propName) => {
        nodeList.forEach((box) => {
            // TODO specific treatment here, getBoxLiteralValue is fine for a PoC
            const value = getBoxLiteralValue(box);
            const from = box.fromNode();
            if (!from) return;

            if (!(isPrimitive(value) && isNotNullish(value))) {
                toErase.add(from);
                return;
            }

            const debugId = `${name}_${propName}_${String(value)}`;
            const className = style({ [propName]: value }, debugId);
            classMap.set(debugId, className);
            toReplace.set(from, className);

            // console.log({ name, propName, value, className, from: from.getKindName() });
        });
    });

    return { toErase, toReplace, classMap };
}

type Nullable<T> = T | null | undefined;

export const isNotNullish = <T>(element: Nullable<T>): element is T => element != null;
