import { createLogger } from "@box-extractor/logger";
import { tsquery } from "@phenomnomnominal/tsquery";
import { castAsArray } from "pastable";
import type { CallExpression, Identifier, JsxSpreadAttribute, Node } from "ts-morph";

import { extractCallExpressionValues } from "./extractCallExpressionIdentifierValues";
import { extractJsxAttributeIdentifierValue } from "./extractJsxAttributeIdentifierValue";
import { extractJsxSpreadAttributeValues } from "./extractJsxSpreadAttributeValues";
import { castObjectLikeAsMapValue, BoxNode, MapTypeValue, box } from "./type-factory";
import type { ExtractOptions, ListOrAll, BoxNodesMap, PropNodesMap, FunctionNodesMap, QueryBox } from "./types";
import { castAsExtractableMap, isNotNullish } from "./utils";

const logger = createLogger("box-ex:extractor:extract");

export const extract = ({ ast, components: _components, functions: _functions, extractMap }: ExtractOptions) => {
    const components = castAsExtractableMap(_components ?? {});
    const functions = castAsExtractableMap(_functions ?? {});

    // contains all the extracted nodes from this ast
    // where as `used` is the global map that is populated by this function in multiple calls
    const extracted = new Map() as BoxNodesMap;

    Object.entries(components ?? {}).forEach(([componentName, component]) => {
        const propNameList = component.properties;
        const canTakeAllProp = propNameList === "all";

        const localNodes = new Map() as PropNodesMap["nodesByProp"];
        extracted.set(componentName, { kind: "component", nodesByProp: localNodes });

        if (!extractMap.has(componentName)) {
            extractMap.set(componentName, { kind: "component", nodesByProp: new Map() });
        }

        const componentMap = extractMap.get(componentName)!;
        const identifierSelector = componentName.includes(".")
            ? `PropertyAccessExpression:has(Identifier[name="${componentName.split(".")[0]}"])`
            : `Identifier[name="${componentName}"]`;
        const componentSelector = `:matches(JsxOpeningElement, JsxSelfClosingElement):has(${identifierSelector})`;

        const namedProp = canTakeAllProp ? "" : `[name=/${propNameList.join("|")}/]`;
        const propIdentifier = `Identifier${namedProp}`;
        const propSelector = `${componentSelector} JsxAttribute > ${propIdentifier}`;
        // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
        //           ^^^^^           ^^^^^^^^^^^^^^^

        const identifierNodesFromJsxAttribute = query<Identifier>(ast, propSelector) ?? [];
        identifierNodesFromJsxAttribute.forEach((node) => {
            const propName = node.getText();
            const propNodes = componentMap.nodesByProp.get(propName) ?? [];

            const maybeNodes = extractJsxAttributeIdentifierValue(node);
            logger({ propName, maybeNodes });

            const fromNode = () => node;
            const extractedNodes = castAsArray(maybeNodes)
                .filter(isNotNullish)
                .map((box) => {
                    box.fromNode = fromNode;
                    return box;
                }) as BoxNode[];
            localNodes.set(propName, (localNodes.get(propName) ?? []).concat(extractedNodes));

            extractedNodes.forEach((node) => {
                propNodes.push(node);
            });

            if (propNodes.length > 0) {
                componentMap.nodesByProp.set(propName, propNodes);
            }
        });

        const spreadSelector = `${componentSelector} JsxSpreadAttribute`;
        // <ColorBox {...{ color: "facebook.100" }}>spread</ColorBox>
        //           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        const spreadNodes = query<JsxSpreadAttribute>(ast, spreadSelector) ?? [];
        spreadNodes.forEach((node) => {
            const objectOrMapType = extractJsxSpreadAttributeValues(node);
            const map = castObjectLikeAsMapValue(objectOrMapType, node);
            const fromNode = () => node;

            const entries = mergeSpreadEntries({ map, propNameList });
            entries.forEach(([propName, propValue]) => {
                logger.scoped("merge-spread", { jsx: true, propName, propValue });

                propValue.forEach((value) => {
                    value.fromNode = fromNode;

                    localNodes.set(propName, (localNodes.get(propName) ?? []).concat(value));
                    componentMap.nodesByProp.set(
                        propName,
                        (componentMap.nodesByProp.get(propName) ?? []).concat(value)
                    );
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
        const localNodes = new Map() as PropNodesMap["nodesByProp"];
        const localList = [] as QueryBox[];
        extracted.set(functionName, { kind: "function", nodesByProp: localNodes, queryList: localList });

        if (!extractMap.has(functionName)) {
            extractMap.set(functionName, { kind: "function", nodesByProp: new Map(), queryList: [] });
        }

        const fnMap = extractMap.get(functionName)! as FunctionNodesMap;
        const fnSelector = `CallExpression:has(Identifier[name="${functionName}"])`;
        // <div className={colorSprinkles({ color: "blue.100" })}></ColorBox>
        //                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        logger({ fnSelector, functionName, propNameList });
        const maybeObjectNodes = query<CallExpression>(ast, fnSelector) ?? [];
        maybeObjectNodes.forEach((node) => {
            const objectOrMapType = extractCallExpressionValues(node);
            if (!objectOrMapType) return;
            // console.log({ objectOrMapType });

            const map = castObjectLikeAsMapValue(objectOrMapType, node);
            const entries = mergeSpreadEntries({ map, propNameList });
            const fromNode = () => node;

            const mapAfterSpread = new Map() as MapTypeValue;
            entries.forEach(([propName, propValue]) => {
                mapAfterSpread.set(propName, propValue);
            });

            const query = { fromNode, box: box.map(mapAfterSpread, node) } as QueryBox;
            query.box.fromNode = fromNode;
            fnMap.queryList.push(query);
            localList.push(query);

            entries.forEach(([propName, propValue]) => {
                logger.scoped("merge-spread", { fn: true, propName, propValue });

                propValue.forEach((value) => {
                    value.fromNode = fromNode;
                    localNodes.set(propName, (localNodes.get(propName) ?? []).concat(value));
                    fnMap.nodesByProp.set(propName, (fnMap.nodesByProp.get(propName) ?? []).concat(value));
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
function mergeSpreadEntries({ map, propNameList: maybePropNameList }: { map: MapTypeValue; propNameList: ListOrAll }) {
    const foundPropList = new Set<string>();
    const canTakeAllProp = maybePropNameList === "all";
    const propNameList = canTakeAllProp ? [] : maybePropNameList;

    const merged = Array.from(map.entries())
        .reverse()
        .filter(([propName]) => {
            if (!canTakeAllProp && !propNameList.includes(propName)) return false;
            if (foundPropList.has(propName)) return false;

            foundPropList.add(propName);
            return true;
        });
    logger.lazyScoped("merge-spread", () => ({ extracted: map, merged }));

    // reverse again to keep the original order
    return merged.reverse();
}

// https://gist.github.com/dsherret/826fe77613be22676778b8c4ba7390e7
export function query<T extends Node = Node>(node: Node, q: string): T[] {
    return tsquery(node.compilerNode as any, q).map((n) => (node as any)._getNodeFromCompilerNode(n) as T);
}
