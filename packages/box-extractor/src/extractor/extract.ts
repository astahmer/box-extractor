import { createLogger } from "@box-extractor/logger";
import { tsquery } from "@phenomnomnominal/tsquery";
import { castAsArray } from "pastable";
import { JsxOpeningElement, JsxSelfClosingElement, Node } from "ts-morph";

import { extractCallExpressionValues } from "./extractCallExpressionIdentifierValues";
import { extractJsxAttributeIdentifierValue } from "./extractJsxAttributeIdentifierValue";
import { extractJsxSpreadAttributeValues } from "./extractJsxSpreadAttributeValues";
import { box, castObjectLikeAsMapValue, MapTypeValue } from "./type-factory";
import type {
    BoxNodesMap,
    ComponentNodesMap,
    ExtractableMap,
    ExtractOptions,
    FunctionNodesMap,
    ListOrAll,
    QueryComponentBox,
    QueryFnBox,
} from "./types";
import { castAsExtractableMap, isNotNullish } from "./utils";

const logger = createLogger("box-ex:extractor:extract");
type QueryComponentMap = Map<JsxOpeningElement | JsxSelfClosingElement, { name: string; props: MapTypeValue }>;

const getComponentName = ({
    node,
    components,
    factories,
}: {
    node: JsxOpeningElement | JsxSelfClosingElement;
    components: ExtractableMap;
    factories: Record<string, string>;
}) => {
    const tagNameNode = node.getTagNameNode();
    if (Node.isPropertyAccessExpression(tagNameNode)) {
        const factoryName = tagNameNode.getExpression().getText();
        const factoryGlob = factories[factoryName];
        if (factoryGlob && components[factoryGlob]) {
            return factoryGlob;
        }
    }

    return tagNameNode.getText();
};

export const extract = ({
    ast,
    components: _components,
    functions: _functions,
    extractMap = new Map(),
}: ExtractOptions) => {
    const components = castAsExtractableMap(_components ?? {});
    const functions = castAsExtractableMap(_functions ?? {});
    const factories = Object.fromEntries(
        Object.keys(components)
            .filter((key) => key.includes(".*"))
            .map((key) => [key.replace(".*", ""), key])
    );

    // contains all the extracted nodes from this ast parsing
    // whereas `extractMap` is the global map that could be populated by this function in multiple `extract` calls
    const localExtraction = new Map() as BoxNodesMap;
    const queryComponentMap = new Map() as QueryComponentMap;

    const visitedCallExpresisionList = new WeakSet<Node>();

    ast.forEachDescendant((node, traversal) => {
        // quick win
        if (Node.isImportDeclaration(node)) {
            traversal.skip();
            return;
        }

        const parentNode = node.getParent() ?? null;

        if (parentNode && Node.isJsxSpreadAttribute(node)) {
            // <ColorBox {...{ color: "facebook.100" }}>spread</ColorBox>
            //           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

            const componentNode = parentNode.getFirstAncestor(
                (node): node is JsxOpeningElement | JsxSelfClosingElement =>
                    Node.isJsxOpeningElement(node) || Node.isJsxSelfClosingElement(node)
            );
            if (!componentNode) return;

            const componentName = getComponentName({ node: componentNode, components, factories });
            const component = components[componentName];
            if (!component) return;

            if (!localExtraction.has(componentName)) {
                localExtraction.set(componentName, {
                    kind: "component",
                    nodesByProp: new Map(),
                    queryList: [],
                });
            }

            const localNodes = localExtraction.get(componentName)!.nodesByProp;

            if (!extractMap.has(componentName)) {
                extractMap.set(componentName, { kind: "component", nodesByProp: new Map(), queryList: [] });
            }

            const componentMap = extractMap.get(componentName)! as ComponentNodesMap;
            // console.log(componentName, componentMap);

            if (!queryComponentMap.has(componentNode)) {
                queryComponentMap.set(componentNode, { name: componentName, props: new Map() });
            }

            const objectOrMapType = extractJsxSpreadAttributeValues(node);
            const map = castObjectLikeAsMapValue(objectOrMapType, node);

            const parentRef = queryComponentMap.get(componentNode)!;
            const boxed = box.map(map, node, [componentNode]);
            parentRef.props.set(`_SPREAD_${parentRef.props.size}`, [boxed]);

            const entries = mergeSpreadEntries({ map, propNameList: component.properties });
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

            return;
        }

        if (parentNode && Node.isIdentifier(node)) {
            if (Node.isJsxAttribute(parentNode)) {
                // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
                //           ^^^^^           ^^^^^^^^^^^^^^^

                const componentNode = parentNode.getFirstAncestor(
                    (node): node is JsxOpeningElement | JsxSelfClosingElement =>
                        Node.isJsxOpeningElement(node) || Node.isJsxSelfClosingElement(node)
                );
                if (!componentNode) return;

                const componentName = getComponentName({ node: componentNode, components, factories });
                const component = components[componentName];
                if (!component) return;

                const propName = node.getText();
                if (component.properties !== "all" && !component.properties.includes(propName)) return;
                // console.log({ componentName, propName });

                const maybeBox = extractJsxAttributeIdentifierValue(node);
                if (!maybeBox) return;

                logger({ propName, maybeBox });

                if (!localExtraction.has(componentName)) {
                    localExtraction.set(componentName, {
                        kind: "component",
                        nodesByProp: new Map(),
                        queryList: [],
                    });
                }

                const localNodes = localExtraction.get(componentName)!.nodesByProp;

                if (!extractMap.has(componentName)) {
                    extractMap.set(componentName, { kind: "component", nodesByProp: new Map(), queryList: [] });
                }

                const componentMap = extractMap.get(componentName)! as ComponentNodesMap;

                localNodes.set(propName, (localNodes.get(propName) ?? []).concat(maybeBox));

                if (!queryComponentMap.has(componentNode)) {
                    queryComponentMap.set(componentNode, { name: componentName, props: new Map() });
                }

                const parentRef = queryComponentMap.get(componentNode)!;
                parentRef.props.set(propName, [maybeBox]);

                const propNodes = componentMap.nodesByProp.get(propName) ?? [];
                propNodes.push(maybeBox);

                if (propNodes.length > 0) {
                    componentMap.nodesByProp.set(propName, propNodes);
                }
            }

            if (Node.isCallExpression(parentNode) && !visitedCallExpresisionList.has(parentNode)) {
                visitedCallExpresisionList.add(parentNode);

                const expr = parentNode.getExpression();
                const functionName = expr.getText();
                const component = functions[functionName];
                if (!component) return;

                const maybeBox = extractCallExpressionValues(parentNode);
                if (!maybeBox) return;
                // console.log({ objectOrMapType });

                if (!localExtraction.has(functionName)) {
                    localExtraction.set(functionName, {
                        kind: "function",
                        nodesByProp: new Map(),
                        queryList: [],
                    });
                }

                if (!extractMap.has(functionName)) {
                    extractMap.set(functionName, { kind: "component", nodesByProp: new Map(), queryList: [] });
                }

                const fnMap = extractMap.get(functionName)! as FunctionNodesMap;
                const localFnMap = localExtraction.get(functionName)! as FunctionNodesMap;

                const localNodes = localFnMap.nodesByProp;
                const localList = localFnMap.queryList;
                // console.log(componentName, componentMap);

                const fromNode = () => parentNode;
                const boxList = castAsArray(maybeBox)
                    .map((boxNode) => {
                        if (boxNode.isEmptyInitializer()) return;

                        if (boxNode.isObject() || boxNode.isMap()) {
                            const map = castObjectLikeAsMapValue(boxNode, parentNode);
                            const entries = mergeSpreadEntries({ map, propNameList: component.properties });

                            const mapAfterSpread = new Map() as MapTypeValue;
                            entries.forEach(([propName, propValue]) => {
                                mapAfterSpread.set(propName, propValue);
                            });

                            entries.forEach(([propName, propValue]) => {
                                logger.scoped("merge-spread", { fn: true, propName, propValue });

                                propValue.forEach((value) => {
                                    localNodes.set(propName, (localNodes.get(propName) ?? []).concat(value));
                                    fnMap.nodesByProp.set(
                                        propName,
                                        (fnMap.nodesByProp.get(propName) ?? []).concat(value)
                                    );
                                });
                            });

                            return box.map(mapAfterSpread, parentNode, boxNode.getStack());
                        }

                        return boxNode;
                    })
                    .filter(isNotNullish);

                const query = {
                    name: functionName,
                    fromNode,
                    box: box.list(boxList, parentNode, [parentNode]),
                } as QueryFnBox;
                fnMap.queryList.push(query);
                localList.push(query);
            }
        }
    });

    queryComponentMap.forEach((parentRef, componentNode) => {
        const componentName = parentRef.name;
        const componentMap = extractMap.get(componentName)! as ComponentNodesMap;
        const localList = (localExtraction.get(componentName)! as ComponentNodesMap).queryList;

        const query = {
            name: parentRef.name,
            fromNode: () => componentNode,
            box: box.map(parentRef.props, componentNode, []),
        } as QueryComponentBox;
        queryComponentMap;

        componentMap.queryList.push(query);
        localList.push(query);
    });

    return localExtraction;
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
