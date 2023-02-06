import { createLogger } from "@box-extractor/logger";
import { tsquery } from "@phenomnomnominal/tsquery";
import { castAsArray } from "pastable";
import { Identifier, JsxOpeningElement, JsxSelfClosingElement, JsxSpreadAttribute, Node, ts } from "ts-morph";

import { extractCallExpressionValues } from "./extractCallExpressionIdentifierValues";
import { extractJsxAttributeIdentifierValue } from "./extractJsxAttributeIdentifierValue";
import { extractJsxSpreadAttributeValues } from "./extractJsxSpreadAttributeValues";
import { box, castObjectLikeAsMapValue, MapTypeValue } from "./type-factory";
import type {
    BoxNodesMap,
    ComponentNodesMap,
    ExtractOptions,
    FunctionNodesMap,
    ListOrAll,
    PropNodesMap,
    QueryFnBox,
    QueryComponentBox,
} from "./types";
import { castAsExtractableMap, isNotNullish } from "./utils";

const logger = createLogger("box-ex:extractor:extract");
type QueryComponentMap = Map<JsxOpeningElement | JsxSelfClosingElement, { name: string; props: MapTypeValue }>;

export const extract = ({
    ast,
    components: _components,
    functions: _functions,
    extractMap = new Map(),
}: ExtractOptions) => {
    const components = castAsExtractableMap(_components ?? {});
    const functions = castAsExtractableMap(_functions ?? {});

    // contains all the extracted nodes from this ast
    // where as `used` is the global map that is populated by this function in multiple calls
    const extracted = new Map() as BoxNodesMap;

    Object.entries(components ?? {}).forEach(([componentName, component]) => {
        const propNameList = component.properties;
        const canTakeAllProp = propNameList === "all";

        const localNodes = new Map() as PropNodesMap["nodesByProp"];
        const localList = [] as ComponentNodesMap["queryList"];
        extracted.set(componentName, { kind: "component", nodesByProp: localNodes, queryList: localList });

        if (!extractMap.has(componentName)) {
            extractMap.set(componentName, { kind: "component", nodesByProp: new Map(), queryList: [] });
        }

        const componentMap = extractMap.get(componentName)! as ComponentNodesMap;
        const identifierSelector = componentName.includes(".")
            ? `PropertyAccessExpression:has(Identifier[name="${componentName.split(".")[0]}"])`
            : `Identifier[name="${componentName}"]`;
        const componentSelector = `:matches(JsxOpeningElement, JsxSelfClosingElement):has(${identifierSelector})`;

        const namedProp = canTakeAllProp ? "" : `[name=/${propNameList.join("|")}/]`;
        const propIdentifier = `Identifier${namedProp}`;
        const propSelector = `${componentSelector} JsxAttribute > ${propIdentifier}`;
        // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
        //           ^^^^^           ^^^^^^^^^^^^^^^

        const queryComponentMap = new Map() as QueryComponentMap;

        const identifierNodesFromJsxAttribute = query<Identifier>(ast, propSelector) ?? [];
        identifierNodesFromJsxAttribute.forEach((node) => {
            const propName = node.getText();
            const propNodes = componentMap.nodesByProp.get(propName) ?? [];

            const maybeBox = extractJsxAttributeIdentifierValue(node);
            if (!isNotNullish(maybeBox)) return;

            logger({ propName, maybeBox });
            localNodes.set(propName, (localNodes.get(propName) ?? []).concat(maybeBox));

            const parent = node.getFirstAncestor(
                (n) => Node.isJsxOpeningElement(n) || Node.isJsxSelfClosingElement(n)
            ) as JsxOpeningElement | JsxSelfClosingElement | undefined;
            if (!parent) return;

            if (!queryComponentMap.has(parent)) {
                queryComponentMap.set(parent, { name: componentName, props: new Map() });
            }

            const parentRef = queryComponentMap.get(parent)!;
            parentRef.props.set(propName, [maybeBox]);

            propNodes.push(maybeBox);

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

            const parent = node.getFirstAncestor(
                (n) => Node.isJsxOpeningElement(n) || Node.isJsxSelfClosingElement(n)
            ) as JsxOpeningElement | JsxSelfClosingElement | undefined;
            if (!parent) return;

            if (!queryComponentMap.has(parent)) {
                queryComponentMap.set(parent, { name: componentName, props: new Map() });
            }

            const stack = [parent];

            const parentRef = queryComponentMap.get(parent)!;
            const boxed = box.map(map, node, stack);
            parentRef.props.set(`_SPREAD_${parentRef.props.size}`, [boxed]);

            const entries = mergeSpreadEntries({ map, propNameList });
            entries.forEach(([propName, propValue]) => {
                logger.scoped("merge-spread", { jsx: true, propName, propValue });

                propValue.forEach((value) => {
                    localNodes.set(propName, (localNodes.get(propName) ?? []).concat(value));
                    componentMap.nodesByProp.set(
                        propName,
                        (componentMap.nodesByProp.get(propName) ?? []).concat(value)
                    );
                });
            });
        });

        queryComponentMap.forEach((ref, jsxNode) => {
            const fromNode = () => jsxNode;
            // TODO ?
            const query = { name: ref.name, fromNode, box: box.map(ref.props, jsxNode, []) } as QueryComponentBox;

            componentMap.queryList.push(query);
            localList.push(query);
        });
    });

    Object.entries(functions ?? {}).forEach(([functionName, component]) => {
        const propNameList = component.properties;
        const localNodes = new Map() as PropNodesMap["nodesByProp"];
        const localList = [] as QueryFnBox[];
        extracted.set(functionName, { kind: "function", nodesByProp: localNodes, queryList: localList });

        if (!extractMap.has(functionName)) {
            extractMap.set(functionName, { kind: "function", nodesByProp: new Map(), queryList: [] });
        }

        const fnMap = extractMap.get(functionName)! as FunctionNodesMap;
        const fnSelector = `CallExpression > Identifier[name="${functionName}"]`;
        // <div className={colorSprinkles({ color: "blue.100" })}></ColorBox>
        //                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        logger({ fnSelector, functionName, propNameList });
        const maybeObjectNodes = query<Identifier>(ast, fnSelector) ?? [];
        maybeObjectNodes.forEach((identifier) => {
            const node = identifier.getParentIfKind(ts.SyntaxKind.CallExpression);
            if (!node) return;

            const maybeBox = extractCallExpressionValues(node);
            if (!maybeBox) return;
            // console.log({ objectOrMapType });

            const fromNode = () => node;
            const boxList = castAsArray(maybeBox)
                .map((boxNode) => {
                    if (boxNode.isEmptyInitializer()) return;

                    if (boxNode.isObject() || boxNode.isMap()) {
                        const map = castObjectLikeAsMapValue(boxNode, node);
                        const entries = mergeSpreadEntries({ map, propNameList });

                        const mapAfterSpread = new Map() as MapTypeValue;
                        entries.forEach(([propName, propValue]) => {
                            mapAfterSpread.set(propName, propValue);
                        });

                        entries.forEach(([propName, propValue]) => {
                            logger.scoped("merge-spread", { fn: true, propName, propValue });

                            propValue.forEach((value) => {
                                localNodes.set(propName, (localNodes.get(propName) ?? []).concat(value));
                                fnMap.nodesByProp.set(propName, (fnMap.nodesByProp.get(propName) ?? []).concat(value));
                            });
                        });

                        return box.map(mapAfterSpread, node, boxNode.getStack());
                    }

                    return boxNode;
                })
                .filter(isNotNullish);

            const query = { name: functionName, fromNode, box: box.list(boxList, node, [node]) } as QueryFnBox;
            fnMap.queryList.push(query);
            localList.push(query);
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
    if (map.size <= 1) return Array.from(map.entries());

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
