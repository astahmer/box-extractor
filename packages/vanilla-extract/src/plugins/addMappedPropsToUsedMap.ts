import type { UsedComponentMap } from "./getUsedPropertiesFromExtractNodeMap";

/**
 * Let's say you have a component that uses one (or multiple) mapped prop:
 *
 * ```tsx
 * const Stack = ({ direction = "column", spacing = 5 }) => {
    return (
        <div
            className={sprinklesFn({
                flexDirection: direction,
                paddingRight: direction === "row" ? spacing : undefined,
                paddingBottom: direction === "column" ? spacing : undefined,
            })}
        />
    );
};
```
 *
 * And you use it like this:
 *
 * ```tsx
 * <Stack direction="row" spacing="8">
 * // children
 * </Stack>
 * ```
 *
 * The `direction` prop will be mapped to `flexDirection` implicitly in the component.
 * But the @box-extractor/vanilla-extract plugin will only associate the `direction` prop with the value `row` and not with the `flexDirection` prop.
 * Same goes for the `spacing` prop, which will be mapped to `paddingRight` and `paddingBottom` implicitly but only `spacing` prop will only be associated with the `8` value.
 *
 * This functions solves that with the plugin option `mappedProps: { direction: ["flexDirection"], space: ["paddingBottom", "paddingRight"] }`
 * So that the `flexDirection` and `paddingRight`/`paddingBottom` props will also be associated with the `row` and `8` values respectively.
 */
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
