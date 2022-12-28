import { tsquery } from "@phenomnomnominal/tsquery";
import debug from "debug";
import { castAsArray, isObjectLiteral } from "pastable";
import type { CallExpression, Identifier, JsxSpreadAttribute, Node } from "ts-morph";

import { extractCallExpressionValues } from "./extractCallExpressionIdentifierValues";
import { extractJsxAttributeIdentifierValue } from "./extractJsxAttributeIdentifierValue";
import { extractJsxSpreadAttributeValues } from "./extractJsxSpreadAttributeValues";
import type {
    ComponentUsedPropertiesStyle,
    ExtractedComponentProperties,
    ExtractedPropPair,
    ExtractOptions,
    ListOrAll,
} from "./types";
import { isNotNullish } from "./utils";

const logger = debug("box-ex:extractor:extract");

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
            used.set(componentName, { properties: new Map(), conditionalProperties: new Map() });
        }

        const componentMap = used.get(componentName)!;
        const componentSelector = `:matches(JsxOpeningElement, JsxSelfClosingElement):has(Identifier[name="${componentName}"])`;

        const namedProp = canTakeAllProp ? "" : `[name=/${propNameList.join("|")}/]`;
        const propIdentifier = `Identifier${namedProp}`;
        const propSelector = `${componentSelector} JsxAttribute > ${propIdentifier}`;
        // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
        //           ^^^^^           ^^^^^^^^^^^^^^^
        logger({ propSelector });

        const identifierNodesFromJsxAttribute = query<Identifier>(ast, propSelector) ?? [];
        identifierNodesFromJsxAttribute.forEach((node) => {
            const propName = node.getText();

            const propValues = componentMap.properties.get(propName) ?? new Set();
            const conditionalProps = componentMap.conditionalProperties.get(propName) ?? new Map();

            if (!componentMap.properties.has(propName)) {
                componentMap.properties.set(propName, propValues);
            }

            if (!componentMap.conditionalProperties.has(propName)) {
                componentMap.conditionalProperties.set(propName, conditionalProps);
            }

            const extracted = extractJsxAttributeIdentifierValue(node);
            logger({ propName, extracted });

            const extractedValues = castAsArray(extracted).filter(isNotNullish);
            extractedValues.forEach((value) => {
                if (typeof value === "string") {
                    propValues.add(value);
                }

                if (isObjectLiteral(value)) {
                    Object.entries(value).forEach(([conditionName, value]) => {
                        const conditionValues = conditionalProps.get(conditionName) ?? new Set();
                        if (!conditionalProps.has(conditionName)) {
                            conditionalProps.set(conditionName, conditionValues);
                        }

                        conditionValues.add(value);
                    });
                }
            });

            extractedComponentPropValues.push([propName, extracted] as ExtractedPropPair);
        });

        const spreadSelector = `${componentSelector} JsxSpreadAttribute`;
        // <ColorBox {...{ color: "facebook.100" }}>spread</ColorBox>
        //           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        logger({ spreadSelector });

        const spreadNodes = query<JsxSpreadAttribute>(ast, spreadSelector) ?? [];
        spreadNodes.forEach((node) => {
            const extracted = extractJsxSpreadAttributeValues(node);
            logger({ extracted });

            return mergeSpreadEntries({
                extracted,
                propNameList,
                componentMap,
                extractedComponentPropValues,
            });
        });

        logger(extractedComponentPropValues);

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
            used.set(functionName, { properties: new Map(), conditionalProperties: new Map() });
        }

        const componentMap = used.get(functionName)!;
        const sprinklesFnSelector = `JsxAttributes CallExpression:has(Identifier[name="${functionName}"])`;
        // <div className={colorSprinkles({ color: "blue.100" })}></ColorBox>
        //                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        logger({ sprinklesFnSelector, functionName, propNameList });

        const maybeObjectNodes = query<CallExpression>(ast, sprinklesFnSelector) ?? [];
        maybeObjectNodes.forEach((node) => {
            const extracted = extractCallExpressionValues(node);
            logger({ extracted });

            return mergeSpreadEntries({
                extracted,
                propNameList,
                componentMap,
                extractedComponentPropValues,
            });
        });
    });

    // console.dir(used, { depth: null });

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

    const addProp = (propName: string, propValue: ExtractedPropPair[1]) => {
        const propValues = componentMap.properties.get(propName) ?? new Set();

        if (!componentMap.properties.has(propName)) {
            componentMap.properties.set(propName, propValues);
        }

        const extractedValues = (
            (Array.isArray(propValue) ? propValue : [propValue]) as Array<string | ExtractedPropPair>
        ).filter(isNotNullish);
        extractedValues.forEach((value) => {
            if (typeof value === "string") {
                propValues.add(value);
                extractedComponentPropValues.push([propName, value]);
                return;
            }

            const [nestedProp, nestedValue] = value;
            addProp(nestedProp, nestedValue);
        });
    };

    // reverse again to keep the original order
    entries.reverse().forEach(([propName, propValue]) => addProp(propName, propValue));

    return entries;
}

// https://gist.github.com/dsherret/826fe77613be22676778b8c4ba7390e7
export function query<T extends Node = Node>(node: Node, q: string): T[] {
    return tsquery(node.compilerNode as any, q).map((n) => (node as any)._getNodeFromCompilerNode(n) as T);
}
