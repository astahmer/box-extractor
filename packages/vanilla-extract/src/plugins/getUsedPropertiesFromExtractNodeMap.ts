import { BoxNode, BoxNodesMap, isPrimitiveType, PrimitiveType } from "@box-extractor/core";
import { castAsArray } from "pastable";
import { Node } from "ts-morph";

export type PropertiesMap = Map<string, Set<PrimitiveType>>;
export type ConditionalPropertiesMap = Map<string, Map<string, Set<PrimitiveType>>>;
export type UsedComponentMap = Map<
    string,
    { properties: PropertiesMap; conditionalProperties: ConditionalPropertiesMap }
>;
export const getUsedPropertiesFromExtractNodeMap = (nodeMap: BoxNodesMap, usedComponents: UsedComponentMap) => {
    const usedDebugIdList = new Set<string>();
    const usedSprinkleDebugIdList = new Set<string>();
    const usedRecipeDebugIdList = new Set<string>();
    console.log({ getUsedPropertiesFromExtractNodeMap: true, nodeMap, usedComponents });

    nodeMap.forEach((boxEl, name) => {
        const currentElement = usedComponents.get(name);
        const properties = currentElement?.properties ?? new Map<string, Set<PrimitiveType>>();
        const conditionalProperties =
            currentElement?.conditionalProperties ?? new Map<string, Map<string, Set<PrimitiveType>>>();

        boxEl.nodesByProp.forEach((attrNodes, attrName) => {
            const propertiesList = properties.get(attrName) ?? new Set<PrimitiveType>();
            const propertiesListAtCondition =
                conditionalProperties.get(attrName) ?? new Map<string, Set<PrimitiveType>>();

            const visitNode = (visited: BoxNode, isFromRecipe: boolean) => {
                if (visited.type === "literal") {
                    const values = castAsArray(visited.value);
                    values.forEach((value) => {
                        if (!isFromRecipe) {
                            usedDebugIdList.add(`${name}_${attrName}_${value}`);
                            usedSprinkleDebugIdList.add(`${name}_${attrName}_${value}`);
                            propertiesList.add(value);
                        } else {
                            usedDebugIdList.add(`recipe.${name}.variant.${attrName}_${value}`);
                            usedRecipeDebugIdList.add(`recipe.${name}.variant.${attrName}_${value}`);
                        }
                    });
                }

                if (visited.type === "map") {
                    visited.value.forEach((propNodes, propName) => {
                        propNodes.forEach((innerNode) => {
                            if (innerNode.type === "literal" && isPrimitiveType(innerNode.value)) {
                                if (!isFromRecipe) {
                                    const actualPropName = attrName.startsWith("_") ? propName : attrName;
                                    const conditionName = attrName.startsWith("_") ? attrName : propName;

                                    usedDebugIdList.add(
                                        `${name}_${actualPropName}_${conditionName}_${innerNode.value}`
                                    );
                                    usedSprinkleDebugIdList.add(
                                        `${name}_${actualPropName}_${conditionName}_${innerNode.value}`
                                    );

                                    const current = propertiesListAtCondition.get(propName);
                                    if (current) {
                                        current.add(innerNode.value);
                                    } else {
                                        propertiesListAtCondition.set(propName, new Set([innerNode.value]));
                                    }
                                } else {
                                    usedDebugIdList.add(`recipe.${name}.variant.${attrName}_${innerNode.value}`);
                                    usedRecipeDebugIdList.add(`recipe.${name}.variant.${attrName}_${innerNode.value}`);
                                }
                            }
                        });
                    });
                }

                if (visited.type === "object") {
                    Object.entries(visited.value).forEach(([propName, literal]) => {
                        if (isPrimitiveType(literal)) {
                            if (!isFromRecipe) {
                                const actualPropName = attrName.startsWith("_") ? propName : attrName;
                                const conditionName = attrName.startsWith("_") ? attrName : propName;

                                usedDebugIdList.add(`${name}_${actualPropName}_${conditionName}_${literal}`);
                                usedSprinkleDebugIdList.add(`${name}_${actualPropName}_${conditionName}_${literal}`);

                                const current = propertiesListAtCondition.get(propName);
                                if (current) {
                                    current.add(literal);
                                } else {
                                    propertiesListAtCondition.set(propName, new Set([literal]));
                                }
                            } else {
                                usedDebugIdList.add(`recipe.${name}.variant.${attrName}_${literal}`);
                                usedRecipeDebugIdList.add(`recipe.${name}.variant.${attrName}_${literal}`);
                            }
                        }
                    });
                }
            };

            attrNodes.forEach((attrNode) => {
                const maybeNode = attrNode.getNode();
                const node = Array.isArray(maybeNode) ? maybeNode[0] : maybeNode;
                const isFromRecipe = isVanillaExtractRecipe(name, node);

                if (isFromRecipe) {
                    usedDebugIdList.add(`recipe.${name}.default`);
                    usedRecipeDebugIdList.add(`recipe.${name}.default`);
                }

                // console.log({ node: node?.getText(), kind: node?.getKindName(), isRecipe: isFromRecipe });
                if (attrNode.type === "conditional") {
                    visitNode(attrNode.whenTrue, isFromRecipe);
                    visitNode(attrNode.whenFalse, isFromRecipe);
                } else {
                    visitNode(attrNode, isFromRecipe);
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

    console.log({ usedDebugIdList });

    return {
        usedComponents,
        usedDebugIdList,
        usedSprinkleDebugIdList,
        usedRecipeDebugIdList,
    };
};

const isFunctionWithName = (name: string, node: Node | undefined) => {
    if (!node) return false;
    // console.log({ node: node?.getText(), kind: node?.getKindName() });

    if (!Node.isCallExpression(node)) return false;
    if (!Node.isIdentifier(node.getExpression())) return false;

    return node.getExpression().getText() === name;
};

const isVanillaExtractRecipe = (identifierName: string, node: Node | undefined): boolean => {
    if (!node) return false;

    const identifier = node.getParentWhile((n) => !isFunctionWithName(identifierName, n));
    if (!identifier) return false;

    const declaration = node.getParentWhile((n) => !Node.isVariableDeclaration(n));
    if (!declaration) return false;

    // console.log({ declaration: declaration.getText(), kind: declaration.getKindName() });
    return true;
};

export function mergeExtractResultInUsedMap({
    extractResult,
    usedDebugIdList,
    usedSprinkleDebugIdList,
    usedRecipeDebugIdList,
    usedMap,
}: {
    extractResult: ReturnType<typeof getUsedPropertiesFromExtractNodeMap>;
    usedDebugIdList: Set<string>;
    usedSprinkleDebugIdList: Set<string>;
    usedRecipeDebugIdList: Set<string>;
    usedMap: UsedComponentMap;
}) {
    extractResult.usedDebugIdList.forEach((id) => usedDebugIdList.add(id));
    extractResult.usedSprinkleDebugIdList.forEach((id) => usedSprinkleDebugIdList.add(id));
    extractResult.usedRecipeDebugIdList.forEach((id) => usedRecipeDebugIdList.add(id));
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
