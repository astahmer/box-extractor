import { isObject } from "pastable";
import type { ObjectLiteralExpression } from "ts-morph";
import type { MaybeObjectLikeBoxReturn } from "./maybeObjectLikeBox";
import type { ExtractedPropMap, PrimitiveType } from "./types";
import { isNotNullish } from "./utils";

const BoxKind = Symbol("BoxNode");
type WithBoxSymbol = { [BoxKind]: true };

export type ObjectType = WithBoxSymbol & { type: "object"; value: ExtractedPropMap; isEmpty?: boolean };
export type LiteralType = WithBoxSymbol & { type: "literal"; value: PrimitiveType | PrimitiveType[] };
export type MapType = WithBoxSymbol & { type: "map"; value: MapTypeValue };
// export type ConditionalType = WithTypeKind & { type: "conditional"; value: BoxNode[] };
export type ConditionalType = WithBoxSymbol & { type: "conditional"; whenTrue: BoxNode; whenFalse: BoxNode };
export type NodeObjectLiteralExpressionType = WithBoxSymbol & {
    type: "node-object-literal";
    value: ObjectLiteralExpression;
};

export type BoxNode = ObjectType | LiteralType | MapType | ConditionalType | NodeObjectLiteralExpressionType;
export type MapTypeValue = Map<string, BoxNode[]>;

// TODO - unresolvable type / null / undefined
export const emptyObjectType: ObjectType = { [BoxKind]: true, type: "object", value: {}, isEmpty: true };

export const isBoxNode = (value: unknown): value is BoxNode => {
    return typeof value === "object" && value !== null && BoxKind in value;
};

const boxTypeFactory = {
    object(value: ExtractedPropMap): ObjectType {
        return { [BoxKind]: true, type: "object", value };
    },
    literal(value: PrimitiveType | PrimitiveType[]): LiteralType {
        return { [BoxKind]: true, type: "literal", value };
    },
    map(value: MapTypeValue): MapType {
        return { [BoxKind]: true, type: "map", value };
    },
    conditional(whenTrue: BoxNode, whenFalse: BoxNode): ConditionalType {
        // return { [TypeKind]: true, type: "conditional", value: [whenTrue, whenFalse] };
        return { [BoxKind]: true, type: "conditional", whenTrue, whenFalse };
    },
    nodeObjectLiteral(value: ObjectLiteralExpression): NodeObjectLiteralExpressionType {
        return { [BoxKind]: true, type: "node-object-literal", value };
    },
    cast<T extends BoxNode>(value: unknown): T | undefined {
        if (!value) return;
        if (isBoxNode(value)) return value as T;
        return toBoxType(value as any) as T;
    },
};

export const box = boxTypeFactory;

export const isPrimitiveType = (value: unknown): value is PrimitiveType => {
    return typeof value === "string" || typeof value === "number";
};

export type SingleLiteralValue = PrimitiveType | Record<string, unknown>;
export type LiteralValue = SingleLiteralValue | SingleLiteralValue[];

export const toBoxType = (value: undefined | BoxNode | ExtractedPropMap | PrimitiveType | PrimitiveType[]) => {
    if (!isNotNullish(value)) return;
    if (isObject(value) && !Array.isArray(value)) {
        if (isBoxNode(value)) return value;
        return box.object(value);
    }

    if (isPrimitiveType(value) || Array.isArray(value)) return box.literal(value);
};

/**
 * Flatten nested tree of conditional types to an array of BoxNode without conditional
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
export const narrowCondionalType = (conditional: ConditionalType): BoxNode[] => {
    const { whenTrue, whenFalse } = conditional;
    const possibleValues = [] as Array<Exclude<BoxNode, ConditionalType>>;

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
export const mergeLiteralTypes = (types: BoxNode[]): BoxNode[] => {
    // console.dir({ types }, { depth: null });
    const literalValues = new Set<PrimitiveType>();
    const others = types.filter((node) => {
        if (node.type === "literal") {
            if (Array.isArray(node.value)) {
                node.value.forEach((value) => literalValues.add(value));
                return false;
            }

            literalValues.add(node.value);
            return false;
        }

        return true;
    });

    const literal = box.literal(Array.from(literalValues));
    // console.dir({ literal, others }, { depth: null });
    return others.concat(literal);
};

export const castObjectLikeAsMapValue = (maybeObject: MaybeObjectLikeBoxReturn): MapTypeValue => {
    if (!maybeObject) return new Map<string, BoxNode[]>();
    if (maybeObject instanceof Map) return maybeObject;
    if (!isBoxNode(maybeObject)) return new Map<string, BoxNode[]>(Object.entries(maybeObject));
    if (maybeObject.type === "map") return maybeObject.value;

    // console.dir({ entries }, { depth: null });
    return new Map<string, BoxNode[]>(
        Object.entries(maybeObject.value).map(([key, value]) => {
            const boxed = box.cast(value);
            if (!boxed) return [key, []];
            return [key, [boxed]];
        })
    );
};
