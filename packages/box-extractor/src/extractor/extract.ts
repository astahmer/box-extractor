import { tsquery } from "@phenomnomnominal/tsquery";
import { castAsArray } from "pastable";
import type { CallExpression, Identifier, JsxSpreadAttribute, Node } from "ts-morph";
import { diary } from "./debug-logger";

import { extractCallExpressionValues } from "./extractCallExpressionIdentifierValues";
import { extractJsxAttributeIdentifierValue } from "./extractJsxAttributeIdentifierValue";
import { extractJsxSpreadAttributeValues } from "./extractJsxSpreadAttributeValues";
import { getLiteralValue } from "./maybeLiteral";
import { castObjectLikeAsMapValue, ExtractedType, LiteralValue } from "./type-factory";
import type {
    ComponentUsedPropertiesStyle,
    ExtractedComponentProperties,
    ExtractedPropPair,
    ExtractOptions,
    ListOrAll,
} from "./types";
import { isNotNullish } from "./utils";

const logger = diary("box-ex:extractor:extract");

export const extract = ({ ast, components: _components, functions: _functions, used }: ExtractOptions) => {
    const components = Array.isArray(_components)
        ? Object.fromEntries(_components.map((name) => [name, { properties: "all" }]))
        : _components;
    const functions = Array.isArray(_functions)
        ? Object.fromEntries(_functions.map((name) => [name, { properties: "all" }]))
        : _functions;

    const componentPropValues: ExtractedComponentProperties[] = [];

    Object.entries(components ?? {}).forEach(([componentName, component]) => {
        const propNameList = component.properties;
        const canTakeAllProp = propNameList === "all";

        const extractedComponentPropValues = [] as ExtractedPropPair[];
        componentPropValues.push([componentName, extractedComponentPropValues]);

        if (!used.has(componentName)) {
            used.set(componentName, {
                properties: new Map(),
                entries: new Map(),
                nodes: new Map(),
                literals: new Map(),
            });
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

            const propValues = componentMap.properties.get(propName) ?? new Set();
            const propEntries = componentMap.entries.get(propName) ?? (new Map() as Map<string, Set<LiteralValue>>);
            const propNodes = componentMap.nodes.get(propName) ?? [];
            const propLiterals = componentMap.literals.get(propName) ?? new Set();

            const extracted = extractJsxAttributeIdentifierValue(node);
            logger(() => ({ propName, extracted }));
            const extractedValues = castAsArray(extracted).filter(isNotNullish) as ExtractedType[];
            extractedValues.forEach((node) => {
                propNodes.push(node);
                const literal = getLiteralValue(node);
                if (literal) {
                    if (Array.isArray(literal)) {
                        literal.forEach((value) => propLiterals.add(value));
                    } else {
                        propLiterals.add(literal);
                    }
                }

                if (node.type === "literal") {
                    propValues.add(node.value);
                    return;
                }

                if (node.type === "object" || node.type === "map") {
                    const entries =
                        node.type === "object" ? Object.entries(node.value) : Array.from(node.value.entries());
                    entries.forEach(([entryPropName, value]) => {
                        const entryPropValues = propEntries.get(entryPropName) ?? new Set();
                        if (!propEntries.has(entryPropName)) {
                            propEntries.set(entryPropName, entryPropValues);
                        }

                        entryPropValues.add(value);
                    });
                }
            });

            if (!componentMap.properties.has(propName) && propValues.size > 0) {
                componentMap.properties.set(propName, propValues);
            }

            if (!componentMap.entries.has(propName) && propEntries.size > 0) {
                componentMap.entries.set(propName, propEntries);
                // console.dir({ propValues, propEntries, propNodes, propLiterals }, { depth: null });
            }

            if (!componentMap.nodes.has(propName) && propNodes.length > 0) {
                componentMap.nodes.set(propName, propNodes);
            }

            if (!componentMap.literals.has(propName) && propLiterals.size > 0) {
                componentMap.literals.set(propName, propLiterals);
            }

            extractedComponentPropValues.push([propName, extractedValues]);
        });

        const spreadSelector = `${componentSelector} JsxSpreadAttribute`;
        // <ColorBox {...{ color: "facebook.100" }}>spread</ColorBox>
        //           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        const spreadNodes = query<JsxSpreadAttribute>(ast, spreadSelector) ?? [];
        spreadNodes.forEach((node) => {
            const objectOrMapType = extractJsxSpreadAttributeValues(node);
            const map = castObjectLikeAsMapValue(objectOrMapType);

            return mergeSpreadEntries({
                extracted: Array.from(map.entries()),
                propNameList,
                componentMap,
                extractedComponentPropValues,
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
        const extractedComponentPropValues = [] as ExtractedPropPair[];
        componentPropValues.push([functionName, extractedComponentPropValues]);

        if (!used.has(functionName)) {
            used.set(functionName, {
                properties: new Map(),
                entries: new Map(),
                nodes: new Map(),
                literals: new Map(),
            });
        }

        const componentMap = used.get(functionName)!;
        const fnSelector = `JsxAttributes CallExpression:has(Identifier[name="${functionName}"])`;
        // <div className={colorSprinkles({ color: "blue.100" })}></ColorBox>
        //                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        logger(() => ({ fnSelector, functionName, propNameList }));
        const maybeObjectNodes = query<CallExpression>(ast, fnSelector) ?? [];
        maybeObjectNodes.forEach((node) => {
            const extracted = extractCallExpressionValues(node);
            if (!extracted) return;
            // console.log({ extracted });

            return mergeSpreadEntries({
                extracted: Array.from(castObjectLikeAsMapValue(extracted).entries()),
                propNameList,
                componentMap,
                extractedComponentPropValues,
            });
        });
    });

    return componentPropValues;
};

/**
 * reverse prop entries so that the last one wins
 * @example <Box sx={{ ...{ color: "red" }, color: "blue" }} />
 * // color: "blue" wins / color: "red" is ignored
 */
function mergeSpreadEntries({
    extracted,
    propNameList: maybePropNameList,
    componentMap,
    extractedComponentPropValues,
}: {
    extracted: ExtractedPropPair[];
    propNameList: ListOrAll;
    componentMap: ComponentUsedPropertiesStyle;
    extractedComponentPropValues: ExtractedPropPair[];
}) {
    const foundPropList = new Set<string>();
    const canTakeAllProp = maybePropNameList === "all";
    const propNameList = canTakeAllProp ? [] : maybePropNameList;

    const entries = extracted.reverse().filter(([propName]) => {
        if (!canTakeAllProp && !propNameList.includes(propName)) return false;
        if (foundPropList.has(propName)) return false;

        foundPropList.add(propName);
        return true;
    });
    logger("merge-spread", () => ({ extracted, entries }));

    // reverse again to keep the original order
    entries.reverse().forEach(([propName, propValue]) => {
        const propValues = componentMap.properties.get(propName) ?? new Set();

        logger("merge-spread", () => ({ propName, propValue, propValues }));
        propValues.add(propValue);
        propValue.forEach((value) => {
            extractedComponentPropValues.push([propName, [value]]);
        });

        if (!componentMap.properties.has(propName) && propValues.size > 0) {
            componentMap.properties.set(propName, propValues);
        }
    });

    return entries;
}

// https://gist.github.com/dsherret/826fe77613be22676778b8c4ba7390e7
export function query<T extends Node = Node>(node: Node, q: string): T[] {
    return tsquery(node.compilerNode as any, q).map((n) => (node as any)._getNodeFromCompilerNode(n) as T);
}
