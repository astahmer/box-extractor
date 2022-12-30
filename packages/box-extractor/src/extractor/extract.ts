import { tsquery } from "@phenomnomnominal/tsquery";
import { castAsArray } from "pastable";
import type { CallExpression, Identifier, JsxSpreadAttribute, Node } from "ts-morph";
import { diary } from "./debug-logger";

import { extractCallExpressionValues } from "./extractCallExpressionIdentifierValues";
import { extractJsxAttributeIdentifierValue } from "./extractJsxAttributeIdentifierValue";
import { extractJsxSpreadAttributeValues } from "./extractJsxSpreadAttributeValues";
import { castObjectLikeAsMapValue, ExtractedType } from "./type-factory";
import type { ExtractedPropPair, ExtractOptions, ListOrAll } from "./types";
import { isNotNullish } from "./utils";

const logger = diary("box-ex:extractor:extract");

export const extract = ({ ast, components: _components, functions: _functions, used }: ExtractOptions) => {
    const components = Array.isArray(_components)
        ? Object.fromEntries(_components.map((name) => [name, { properties: "all" }]))
        : _components;
    const functions = Array.isArray(_functions)
        ? Object.fromEntries(_functions.map((name) => [name, { properties: "all" }]))
        : _functions;

    const extracted = new Map<string, { kind: "component" | "function"; nodes: Map<string, ExtractedType[]> }>();

    Object.entries(components ?? {}).forEach(([componentName, component]) => {
        const propNameList = component.properties;
        const canTakeAllProp = propNameList === "all";

        const nodes = new Map<string, ExtractedType[]>();
        extracted.set(componentName, { kind: "component", nodes });

        if (!used.has(componentName)) {
            used.set(componentName, { nodes: new Map() });
        }

        const componentMap = used.get(componentName)!;
        const componentSelector = `:matches(JsxOpeningElement, JsxSelfClosingElement):has(Identifier[name="${componentName}"])`;

        const namedProp = canTakeAllProp ? "" : `[name=/${propNameList.join("|")}/]`;
        const propIdentifier = `Identifier${namedProp}`;
        const propSelector = `${componentSelector} JsxAttribute > ${propIdentifier}`;
        // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
        //           ^^^^^           ^^^^^^^^^^^^^^^

        const identifierNodesFromJsxAttribute = query<Identifier>(ast, propSelector) ?? [];
        identifierNodesFromJsxAttribute.forEach((node) => {
            const propName = node.getText();
            const propNodes = componentMap.nodes.get(propName) ?? [];

            const extractedNodes = extractJsxAttributeIdentifierValue(node);
            logger(() => ({ propName, extracted: extractedNodes }));

            const extractedValues = castAsArray(extractedNodes).filter(isNotNullish) as ExtractedType[];
            extractedValues.forEach((node) => {
                propNodes.push(node);
            });

            if (!componentMap.nodes.has(propName) && propNodes.length > 0) {
                componentMap.nodes.set(propName, propNodes);
            }

            nodes.set(propName, extractedValues);
        });

        const spreadSelector = `${componentSelector} JsxSpreadAttribute`;
        // <ColorBox {...{ color: "facebook.100" }}>spread</ColorBox>
        //           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        const spreadNodes = query<JsxSpreadAttribute>(ast, spreadSelector) ?? [];
        spreadNodes.forEach((node) => {
            const objectOrMapType = extractJsxSpreadAttributeValues(node);
            const map = castObjectLikeAsMapValue(objectOrMapType);
            const pairs = Array.from(map.entries());

            const entries = mergeSpreadEntries({ extracted: pairs, propNameList });
            entries.forEach(([propName, propValue]) => {
                const propNodes = componentMap.nodes.get(propName) ?? [];
                logger("merge-spread", () => ({ jsx: true, propName, propValue }));

                propValue.forEach((value) => {
                    propNodes.push(value);
                });
            });
        });

        // console.log(extractedComponentPropValues);

        // console.log(
        //     identifierNodesFromJsxAttribute.map((n) => [n.getParent().getText(), extractJsxAttributeIdentifierValue(n)])
        //     // .filter((v) => !v[v.length - 1])
        // );
    });

    Object.entries(functions ?? {}).forEach(([functionName, component]) => {
        const propNameList = component.properties;
        const nodes = new Map<string, ExtractedType[]>();
        extracted.set(functionName, { kind: "function", nodes });

        if (!used.has(functionName)) {
            used.set(functionName, { nodes: new Map() });
        }

        const functionMap = used.get(functionName)!;
        const fnSelector = `JsxAttributes CallExpression:has(Identifier[name="${functionName}"])`;
        // <div className={colorSprinkles({ color: "blue.100" })}></ColorBox>
        //                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        logger(() => ({ fnSelector, functionName, propNameList }));
        const maybeObjectNodes = query<CallExpression>(ast, fnSelector) ?? [];
        maybeObjectNodes.forEach((node) => {
            const objectOrMapType = extractCallExpressionValues(node);
            if (!objectOrMapType) return;
            // console.log({ objectOrMapType });

            const map = castObjectLikeAsMapValue(objectOrMapType);
            const pairs = Array.from(map.entries());
            const entries = mergeSpreadEntries({ extracted: pairs, propNameList });

            entries.forEach(([propName, propValue]) => {
                const propNodes = functionMap.nodes.get(propName) ?? [];
                logger("merge-spread", () => ({ fn: true, propName, propValue }));

                propValue.forEach((value) => {
                    propNodes.push(value);
                });
            });
        });
    });

    return extracted;
};

/**
 * reverse prop entries so that the last one wins
 * @example <Box sx={{ ...{ color: "red" }, color: "blue" }} />
 * // color: "blue" wins / color: "red" is ignored
 */
function mergeSpreadEntries({
    extracted,
    propNameList: maybePropNameList,
}: {
    extracted: ExtractedPropPair[];
    propNameList: ListOrAll;
}) {
    const foundPropList = new Set<string>();
    const canTakeAllProp = maybePropNameList === "all";
    const propNameList = canTakeAllProp ? [] : maybePropNameList;

    const merged = extracted.reverse().filter(([propName]) => {
        if (!canTakeAllProp && !propNameList.includes(propName)) return false;
        if (foundPropList.has(propName)) return false;

        foundPropList.add(propName);
        return true;
    });
    logger("merge-spread", () => ({ extracted, merged }));

    // reverse again to keep the original order
    return merged.reverse();
}

// https://gist.github.com/dsherret/826fe77613be22676778b8c4ba7390e7
export function query<T extends Node = Node>(node: Node, q: string): T[] {
    return tsquery(node.compilerNode as any, q).map((n) => (node as any)._getNodeFromCompilerNode(n) as T);
}
