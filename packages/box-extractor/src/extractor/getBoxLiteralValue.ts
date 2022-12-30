import {
    BoxNode,
    isPrimitiveType,
    LiteralValue,
    narrowCondionalType,
    NodeObjectLiteralExpressionType,
    SingleLiteralValue,
} from "./type-factory";
import type { PrimitiveType } from "./types";
import { isNotNullish } from "./utils";
import type { MaybeBoxNodeReturn } from "./maybeBoxNode";
import { diary } from "./debug-logger";

const logger = diary("box-ex:extractor:get-literal");

const innerGetLiteralValue = (
    valueType: PrimitiveType | BoxNode | NodeObjectLiteralExpressionType | undefined
): LiteralValue | undefined => {
    if (!valueType) return;
    if (isPrimitiveType(valueType)) return valueType;
    if (valueType.type === "literal") return valueType.value;
    if (valueType.type === "node-object-literal") return;

    if (valueType.type === "object") {
        if (valueType.isEmpty) return;
        return valueType.value;
    }

    if (valueType.type === "map") {
        const entries = Array.from(valueType.value.entries())
            .map(([key, value]) => [key, getBoxLiteralValue(value)])
            .filter(([_key, value]) => isNotNullish(value));

        return Object.fromEntries(entries);
    }

    if (valueType.type === "conditional") {
        const narrowed = narrowCondionalType(valueType);
        logger("narrow", () => ({ valueType, narrowed }));

        if (narrowed.length === 1) {
            return getBoxLiteralValue(narrowed[0]);
        }

        return narrowed
            .map((value) => getBoxLiteralValue(value))
            .filter(isNotNullish)
            .flat();
    }
};

export const getBoxLiteralValue = (maybeBox: MaybeBoxNodeReturn): LiteralValue | undefined => {
    if (!isNotNullish(maybeBox)) return;
    logger(() => ({ maybeBox }));

    if (Array.isArray(maybeBox)) {
        const values = maybeBox
            .map((valueType) => innerGetLiteralValue(valueType))
            .filter(isNotNullish) as SingleLiteralValue[];
        logger(() => ({ values }));

        if (values.length === 0) return;
        if (values.length === 1) return values[0];

        return values;
    }

    return innerGetLiteralValue(maybeBox);
};
