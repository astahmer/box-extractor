import { isObject } from "pastable";
import type { ObjectLiteralExpression } from "ts-morph";
import type { MaybeObjectEntriesReturn } from "./maybeObjectEntries";
import type { ExtractedPropMap, PrimitiveType } from "./types";
import { isNotNullish } from "./utils";

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
    cast<T extends ExtractedType>(value: unknown): T | undefined {
        if (!value) return;
        if (isBoxType(value)) return value as T;
        return toBoxType(value as any) as T;
    },
};

export const box = boxTypeFactory;

export const isPrimitiveType = (value: unknown): value is PrimitiveType => {
    return typeof value === "string" || typeof value === "number";
};

export type LiteralValue = PrimitiveType | Record<string, unknown> | LiteralValue[];

export const toBoxType = (value: undefined | ExtractedType | ExtractedPropMap | PrimitiveType | PrimitiveType[]) => {
    if (!isNotNullish(value)) return;
    if (isObject(value) && !Array.isArray(value)) {
        if (isBoxType(value)) return value;
        return box.object(value);
    }

    if (isPrimitiveType(value) || Array.isArray(value)) return box.literal(value);
};

/**
 * Flatten nested tree of conditional types to an array of ExtractedType without conditional
 * merge LiteralType when possible
 *
 * @example
 * conditional = {
 *  type: "conditional",
 *  whenTrue: {
        type: "conditional",
        whenTrue: { type: "literal", value: "a" },
        whenFalse: { type: "literal", value: "b" },
    },
 *  whenFalse: {
        type: "conditional",
        whenTrue: { type: "literal", value: "c" },
        whenFalse: {
            type: "conditional", value: {
                whenTrue: { type: "literal", value: "d" },
                whenFalse: { type: "object", value: { prop: "xxx" } },
            }
        },
    },
 * }
 *
 * => [{ type: "literal", value: ["a", "b", "c", "d"] }, { type: "object", value: { prop: "xxx" } }]
 */
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

/**
 * Merge all LiteralType in 1 when possible, ignore other types
 *
 * @example
 * types = [{ type: "literal", value: ["a", "b"] }, { type: "literal", value: "c" }]
 * => [{ type: "literal", value: ["a", "b", "c"] }]
 */
export const mergeLiteralTypes = (types: ExtractedType[]): ExtractedType[] => {
    console.dir({ types }, { depth: null });
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
    console.dir({ literal, others }, { depth: null });
    return others.concat(literal);
};

export const castObjectLikeAsMapValue = (maybeObject: MaybeObjectEntriesReturn): MapTypeValue => {
    if (!maybeObject) return new Map<string, ExtractedType[]>();
    if (maybeObject instanceof Map) return maybeObject;
    if (!isBoxType(maybeObject)) return new Map<string, ExtractedType[]>(Object.entries(maybeObject));
    if (maybeObject.type === "map") return maybeObject.value;

    // TODO
    // const entries = Object.entries(maybeObject.value).reduce((acc, [key, value]) => {
    //     const boxed = box.cast(value);
    //     if (boxed) return acc.concat([key, [boxed]]);
    //     return acc;
    // }, [] as Array<[string, ExtractedType[]]>);
    // console.dir({ entries }, { depth: null });
    return new Map<string, ExtractedType[]>(
        Object.entries(maybeObject.value).map(([key, value]) => {
            const boxed = box.cast(value);
            if (!boxed) return [key, []];
            return [key, [boxed]];
        })
    );
};
