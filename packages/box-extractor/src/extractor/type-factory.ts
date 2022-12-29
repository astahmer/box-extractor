import { isObject } from "pastable";
import type { ObjectLiteralExpression } from "ts-morph";
import type { ExtractedPropMap, PrimitiveType } from "./types";
import { isNotNullish } from "./utils";

// TODO ObjectLiteral<PrimitiveType>
const TypeKind = Symbol("TypeKind");
type WithTypeKind = { [TypeKind]: true };

export type ObjectType = WithTypeKind & { type: "object"; value: ExtractedPropMap; isEmpty?: boolean };
export type LiteralType = WithTypeKind & { type: "literal"; value: PrimitiveType | PrimitiveType[] };
export type MapType = WithTypeKind & { type: "map"; value: MapTypeValue };
// export type ConditionalType = WithTypeKind & { type: "conditional"; value: ExtractedType[] };
export type ConditionalType = WithTypeKind & { type: "conditional"; whenTrue: ExtractedType; whenFalse: ExtractedType };
export type NodeObjectLiteralExpressionType = WithTypeKind & {
    type: "node-object-literal";
    value: ObjectLiteralExpression;
};

export type ExtractedType = ObjectType | LiteralType | MapType | ConditionalType | NodeObjectLiteralExpressionType;
export type MapTypeValue = Map<string, ExtractedType[]>;

export const emptyObjectType: ObjectType = { [TypeKind]: true, type: "object", value: {}, isEmpty: true };

export const isBoxType = (value: unknown): value is ExtractedType => {
    return typeof value === "object" && value !== null && TypeKind in value;
};

const boxTypeFactory = {
    object(value: ExtractedPropMap): ObjectType {
        return { [TypeKind]: true, type: "object", value };
    },
    literal(value: PrimitiveType | PrimitiveType[]): LiteralType {
        return { [TypeKind]: true, type: "literal", value };
    },
    map(value: MapTypeValue): MapType {
        return { [TypeKind]: true, type: "map", value };
    },
    conditional(whenTrue: ExtractedType, whenFalse: ExtractedType): ConditionalType {
        // return { [TypeKind]: true, type: "conditional", value: [whenTrue, whenFalse] };
        return { [TypeKind]: true, type: "conditional", whenTrue, whenFalse };
    },
    nodeObjectLiteral(value: ObjectLiteralExpression): NodeObjectLiteralExpressionType {
        return { [TypeKind]: true, type: "node-object-literal", value };
    },
};

export const box = boxTypeFactory;

export const isPrimitiveType = (value: unknown): value is PrimitiveType => {
    return typeof value === "string" || typeof value === "number";
};

export type LiteralValue = PrimitiveType | PrimitiveType[] | Record<string, unknown> | LiteralValue[];

export const toBoxType = (value: undefined | ExtractedType | ExtractedPropMap | PrimitiveType | PrimitiveType[]) => {
    if (!isNotNullish(value)) return;
    if (isPrimitiveType(value) || Array.isArray(value)) return box.literal(value);
    if (isObject(value)) {
        if (isBoxType(value)) return value;
        return { type: "object", value } as ObjectType;
    }
};

/** Flatten nested tree of conditional types to an array of ExtractedType without conditional + merge LiteralType when possible */
export const narrowCondionalType = (conditional: ConditionalType): ExtractedType[] => {
    const { whenTrue, whenFalse } = conditional;
    const possibleValues = [] as Array<Exclude<ExtractedType, ConditionalType>>;

    let current = whenTrue;
    const toNarrow = [whenFalse];
    while (current.type === "conditional" || toNarrow.length > 0) {
        // console.dir({ narrowed: current, toNarrow }, { depth: null });
        if (current.type === "conditional") {
            toNarrow.push(current.whenFalse);
            current = current.whenTrue;
        } else {
            possibleValues.push(current);
            current = toNarrow.pop()!;

            // last possible value
            if (toNarrow.length === 0 && current.type !== "conditional") {
                possibleValues.push(current);
            }
        }
    }

    return mergeLiteralTypes(possibleValues);
};

const mergeLiteralTypes = (types: ExtractedType[]): ExtractedType[] => {
    const literalValues = new Set<PrimitiveType>();
    const others = types.filter((extractedType) => {
        if (extractedType.type === "literal") {
            if (Array.isArray(extractedType.value)) {
                extractedType.value.forEach((value) => literalValues.add(value));
                return false;
            }

            literalValues.add(extractedType.value);
            return false;
        }

        return true;
    });

    const literal = box.literal(Array.from(literalValues));
    return others.concat(literal);
};
