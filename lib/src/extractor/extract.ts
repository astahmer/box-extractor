import { tsquery } from "@phenomnomnominal/tsquery";
import { castAsArray, isObjectLiteral } from "pastable";
import type { Identifier, JsxSpreadAttribute, Node } from "ts-morph";

import { extractJsxAttributeIdentifierValue } from "./extractJsxAttributeIdentifierValue";
import { extractJsxSpreadAttributeValues } from "./extractJsxSpreadAttributeValues";
import type { ExtractedComponentProperties, ExtractedPropPair, ExtractOptions } from "./types";
import { isNotNullish } from "./utils";

// TODO runtime sprinkles fn

// not in extract method, make it another function that can be used to provide a more complete config to `extract` fn
// ->
// TODO find all components that use source <Box /> & that allows spreading props on it
// ex: const CustomBox = (props) => <Box {...props} />
// Box is the source component, CustomBox re-uses it and should also be tracked

export const extract = ({ ast, config, used }: ExtractOptions) => {
    const componentPropValues: ExtractedComponentProperties[] = [];

    Object.entries(config).forEach(([componentName, component]) => {
        const propNameList = component.properties;
        const extractedComponentPropValues = [] as ExtractedPropPair[];
        componentPropValues.push([componentName, extractedComponentPropValues]);

        // console.log(selector);
        if (!used.has(componentName)) {
            used.set(componentName, { properties: new Map(), conditionalProperties: new Map() });
        }

        const componentMap = used.get(componentName)!;

        const propIdentifier = `Identifier[name=/${propNameList.join("|")}/]`;
        const selector = `JsxElement:has(Identifier[name="${componentName}"]) JsxAttribute > ${propIdentifier}`;
        // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
        //           ^^^^^           ^^^^^^^^^^^^^^^

        const identifierNodesFromJsxAttribute = query<Identifier>(ast, selector) ?? [];
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
            // console.log({ propName, extracted });
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

        const spreadSelector = `JsxElement:has(Identifier[name="${componentName}"]) JsxSpreadAttribute`;
        const spreadNodes = query<JsxSpreadAttribute>(ast, spreadSelector) ?? [];
        spreadNodes.forEach((node) => {
            const extracted = extractJsxSpreadAttributeValues(node);
            const foundPropList = new Set<string>();

            // reverse prop entries so that the last one wins
            // ex: <Box sx={{ ...{ color: "red" }, color: "blue" }} />
            // color: "blue" wins / color: "red" is ignored
            const entries = extracted.reverse().filter(([propName]) => {
                if (!propNameList.includes(propName)) return false;
                if (foundPropList.has(propName)) return false;

                foundPropList.add(propName);
                return true;
            });

            // console.log(extracted);

            // reverse again to keep the original order
            entries.reverse().forEach(([propName, propValue]) => {
                const propValues = componentMap.properties.get(propName) ?? new Set();

                if (!componentMap.properties.has(propName)) {
                    componentMap.properties.set(propName, propValues);
                }

                const extractedValues = castAsArray(propValue).filter(isNotNullish);
                extractedValues.forEach((value) => {
                    if (typeof value === "string") {
                        propValues.add(value);
                        extractedComponentPropValues.push([propName, value]);
                    }
                });
            });

            return entries;
        });

        // console.log(extractedComponentPropValues);

        // console.log(
        //     identifierNodesFromJsxAttribute.map((n) => [n.getParent().getText(), extractJsxAttributeIdentifierValue(n)])
        //     // .filter((v) => !v[v.length - 1])
        // );
    });

    return componentPropValues;
};

// https://gist.github.com/dsherret/826fe77613be22676778b8c4ba7390e7
function query<T extends Node = Node>(node: Node, q: string): T[] {
    return tsquery(node.compilerNode as any, q).map((n) => (node as any)._getNodeFromCompilerNode(n) as T);
}
