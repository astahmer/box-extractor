import { BoxNode, isPrimitiveType, BoxNodesMap, PrimitiveType } from "@box-extractor/core";
import { castAsArray } from "pastable";

export type PropertiesMap = Map<string, Set<PrimitiveType>>;
export type ConditionalPropertiesMap = Map<string, Map<string, Set<PrimitiveType>>>;
export type UsedComponentMap = Map<
    string,
    {
        properties: PropertiesMap;
        conditionalProperties: ConditionalPropertiesMap;
    }
>;
export const getUsedPropertiesFromExtractNodeMap = (nodeMap: BoxNodesMap, usedComponents: UsedComponentMap) => {
    const usedDebugIdList = new Set<string>();

    nodeMap.forEach((boxEl, name) => {
        const currentElement = usedComponents.get(name);
        const properties = currentElement?.properties ?? new Map<string, Set<PrimitiveType>>();
        const conditionalProperties =
            currentElement?.conditionalProperties ?? new Map<string, Map<string, Set<PrimitiveType>>>();

        boxEl.nodesByProp.forEach((attrNodes, attrName) => {
            const propertiesList = properties.get(attrName) ?? new Set<PrimitiveType>();
            const propertiesListAtCondition =
                conditionalProperties.get(attrName) ?? new Map<string, Set<PrimitiveType>>();

            const visitNode = (visited: BoxNode) => {
                if (visited.type === "literal") {
                    const values = castAsArray(visited.value);
                    values.forEach((value) => {
                        usedDebugIdList.add(`${name}_${attrName}_${value}`);
                        propertiesList.add(value);
                    });
                }

                if (visited.type === "map") {
                    visited.value.forEach((propNodes, propName) => {
                        propNodes.forEach((innerNode) => {
                            if (innerNode.type === "literal" && isPrimitiveType(innerNode.value)) {
                                const actualPropName = attrName.startsWith("_") ? propName : attrName;
                                const conditionName = attrName.startsWith("_") ? attrName : propName;

                                usedDebugIdList.add(`${name}_${actualPropName}_${conditionName}_${innerNode.value}`);

                                const current = propertiesListAtCondition.get(propName);
                                if (current) {
                                    current.add(innerNode.value);
                                } else {
                                    propertiesListAtCondition.set(propName, new Set([innerNode.value]));
                                }
                            }
                        });
                    });
                }

                if (visited.type === "object") {
                    Object.entries(visited.value).forEach(([propName, literal]) => {
                        if (isPrimitiveType(literal)) {
                            const actualPropName = attrName.startsWith("_") ? propName : attrName;
                            const conditionName = attrName.startsWith("_") ? attrName : propName;

                            usedDebugIdList.add(`${name}_${actualPropName}_${conditionName}_${literal}`);
                            const current = propertiesListAtCondition.get(propName);
                            if (current) {
                                current.add(literal);
                            } else {
                                propertiesListAtCondition.set(propName, new Set([literal]));
                            }
                        }
                    });
                }
            };

            attrNodes.forEach((attrNode) => {
                if (attrNode.type === "conditional") {
                    visitNode(attrNode.whenTrue);
                    visitNode(attrNode.whenFalse);
                } else {
                    visitNode(attrNode);
                }
            });

            if (propertiesList.size > 0 && !properties.has(attrName)) {
                properties.set(attrName, propertiesList);
            }

            if (propertiesListAtCondition.size > 0 && !conditionalProperties.has(attrName)) {
                conditionalProperties.set(attrName, propertiesListAtCondition);
            }
        });

        // TODO
        if (properties.size > 0 || conditionalProperties.size > 0) {
            usedComponents.set(name, { properties, conditionalProperties });
        }
    });

    return {
        usedComponents,
        usedDebugIdList,
    };
};

export function mergeExtractResultInUsedMap(
    extractResult: ReturnType<typeof getUsedPropertiesFromExtractNodeMap>,
    usedDebugIdList: Set<string>,
    usedMap: UsedComponentMap
) {
    extractResult.usedDebugIdList.forEach((id) => usedDebugIdList.add(id));
    extractResult.usedComponents.forEach((value, key) => {
        const currentEl = usedMap.get(key);
        if (!currentEl) {
            usedMap.set(key, value);
            return;
        }

        value.properties.forEach((values, key) => {
            const currentValues = currentEl.properties.get(key);
            if (!currentValues) {
                currentEl.properties.set(key, values);
                return;
            }

            values.forEach((value) => currentValues.add(value));
        });

        value.conditionalProperties.forEach((conditionPropMap, conditionName) => {
            const currentCondition = currentEl.conditionalProperties.get(conditionName);
            if (!currentCondition) {
                currentEl.conditionalProperties.set(conditionName, conditionPropMap);
                return;
            }

            conditionPropMap.forEach((values, propName) => {
                const currentValues = currentCondition.get(propName);
                if (!currentValues) {
                    currentCondition.set(propName, values);
                    return;
                }

                values.forEach((value) => currentValues.add(value));
            });
        });
    });
}
