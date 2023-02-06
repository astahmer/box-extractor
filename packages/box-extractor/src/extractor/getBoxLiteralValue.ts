import type { MaybeBoxNodeReturn } from "./maybeBoxNode";
import { box, BoxNode, LiteralValue, SingleLiteralValue } from "./type-factory";
import { isNotNullish } from "./utils";

// const logger = createLogger("box-ex:extractor:get-literal");

export const cacheMap = new WeakMap();
const innerGetLiteralValue = (node: BoxNode | undefined): LiteralValue | undefined => {
    if (!node) return;
    if (box.isUnresolvable(node)) return;
    if (box.isEmptyInitializer(node)) return;

    if (box.isLiteral(node)) return node.value;
    if (box.isObject(node)) return node.value;
    if (box.isMap(node)) {
        const entries = Array.from(node.value.entries())
            .map(([key, value]) => [key, getBoxLiteralValue(value)])
            .filter(([_key, value]) => isNotNullish(value));

        return Object.fromEntries(entries);
    }

    if (box.isList(node)) {
        return node.value.map((value) => getBoxLiteralValue(value)).filter(isNotNullish) as LiteralValue;
    }

    if (box.isConditional(node)) {
        return [node.whenTrue, node.whenFalse]
            .map((value) => getBoxLiteralValue(value))
            .filter(isNotNullish)
            .flat();
    }
};

export const getBoxLiteralValue = (maybeBox: MaybeBoxNodeReturn): LiteralValue | undefined => {
    if (!isNotNullish(maybeBox)) return;
    // logger({ maybeBox });

    if (cacheMap.has(maybeBox)) return cacheMap.get(maybeBox);
    if (Array.isArray(maybeBox)) {
        const values = maybeBox
            .map((valueType) => innerGetLiteralValue(valueType))
            .filter(isNotNullish) as SingleLiteralValue[];
        // logger({ values });

        let result: any = values;
        if (values.length === 0) result = undefined;
        if (values.length === 1) result = values[0];

        cacheMap.set(maybeBox, result);
        return result;
    }

    const result = innerGetLiteralValue(maybeBox);
    cacheMap.set(maybeBox, result);
    return result;
};
