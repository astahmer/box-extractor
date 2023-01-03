import { UsedComponentMap } from "./getUsedPropertiesFromExtractNodeMap";

export function addMappedPropsToUsedMap(mappedProps: Record<string, string[]>, usedMap: UsedComponentMap) {
    const mapped = mappedProps ?? {};
    usedMap.forEach((el, _componentName) => {
        Object.entries(mapped).forEach(([mappedName, mappedValues]) => {
            if (el.properties.has(mappedName)) {
                const usedWithMappedName = el.properties.get(mappedName)!;
                mappedValues.forEach((mappedValue) => {
                    const current = el.properties.get(mappedValue);
                    if (!current) {
                        el.properties.set(mappedValue, usedWithMappedName);
                        return;
                    }

                    usedWithMappedName.forEach((value) => current.add(value));
                });
            }

            if (el.conditionalProperties.has(mappedName)) {
                const usedWithMappedName = el.conditionalProperties.get(mappedName)!;
                mappedValues.forEach((mappedValue) => {
                    const current = el.conditionalProperties.get(mappedValue);
                    if (!current) {
                        el.conditionalProperties.set(mappedValue, usedWithMappedName);
                        return;
                    }

                    usedWithMappedName.forEach((values, conditionFromMappedName) => {
                        if (current.has(conditionFromMappedName)) {
                            const currentValues = current.get(conditionFromMappedName)!;
                            values.forEach((value) => currentValues.add(value));
                        } else {
                            current.set(conditionFromMappedName, values);
                        }
                    });
                });
            }
        });
    });
}
