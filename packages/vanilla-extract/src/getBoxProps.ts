// adapted from https://github.com/TheMightyPenguin/dessert-box/blob/e39aa98c535f6ef086f7d32c0a03bfbf1be75b86/packages/core/src/index.tsx

import type { AnySprinklesFn } from "./createBoxSprinklesInternal";

export function composeClassNames(...classNames: Array<string | undefined>) {
    const classes = classNames
        .filter((className) => Boolean(className) && className !== " ")
        .map((className) => className?.toString().trim()) as string[];
    return classes.length === 0 ? undefined : classes.join(" ");
}

const isEscapeHatchProp = (prop: string) => prop[0] === "_" && prop[1] === "_";

const isReversedConditionProp = (props: Record<string, unknown>, key: string) =>
    Boolean(key[0] === "_" && typeof props[key] !== null && typeof props[key] === "object" && props[key]);

export function getBoxProps<SprinklesFn extends AnySprinklesFn>(
    props: Record<string, unknown>,
    sprinklesFn: SprinklesFn
) {
    const sprinklesProps: Record<string, unknown> = {};
    const sprinklesEscapeHatchProps: Record<string, unknown> = {};
    const otherProps: Record<string, unknown> = {};

    let hasSprinklesProps = false;
    for (const key in props) {
        const value = props[key];

        // __color="#fff"
        if (isEscapeHatchProp(key)) {
            const actualKey = key.slice(2);
            sprinklesEscapeHatchProps[actualKey] = value;
            // color="red.100"
        } else if (sprinklesFn.properties.has(key)) {
            hasSprinklesProps = true;
            sprinklesProps[key] = value;
            // _hover={{ color: "red.100" }}
        } else if (
            isReversedConditionProp(props, key) &&
            Object.keys(value ?? {}).some((prop) => sprinklesFn.properties.has(prop))
        ) {
            const propsByCondition = value as Record<string, unknown>;
            hasSprinklesProps = true;

            Object.keys(propsByCondition).forEach((prop) => {
                const conditionName = key.slice(1);
                const conditionItem = sprinklesFn.conditions?.find((c) => c.conditionNames.includes(conditionName));

                const propValue = propsByCondition[prop];
                const currentValue = sprinklesProps[prop] as Record<string, unknown> | string | undefined;

                if (currentValue == undefined || typeof currentValue === "object") {
                    sprinklesProps[prop] = {
                        ...(currentValue as any),
                        [conditionName]: propValue,
                    };
                } else if (typeof currentValue === "string") {
                    const newValue = { [conditionName]: propValue };
                    sprinklesProps[prop] = newValue;

                    const defaultConditionName = conditionItem?.defaultCondition;
                    if (defaultConditionName) {
                        newValue[defaultConditionName] = currentValue;
                    }
                }
            });
            // isDisabled={true}
        } else {
            otherProps[key] = props[key];
        }
    }

    return { hasSprinklesProps, sprinklesProps, sprinklesEscapeHatchProps, otherProps };
}
