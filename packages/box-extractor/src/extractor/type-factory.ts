import { isObject } from "pastable";
import type { Node } from "ts-morph";
import type { MaybeObjectLikeBoxReturn } from "./maybeObjectLikeBox";
import type { ExtractedPropMap, PrimitiveType } from "./types";
import { isNotNullish } from "./utils";

const BoxKind = Symbol("BoxNode");
type WithBoxSymbol = { [BoxKind]: true };

export type MaybeNode = Node | Node[];
type WithNode = { getNode: () => MaybeNode };

export type ObjectType = WithBoxSymbol & WithNode & { type: "object"; value: ExtractedPropMap; isEmpty?: boolean };
export type LiteralKind = "array" | "string" | "number" | "boolean" | "null" | "undefined";
export type LiteralType = WithBoxSymbol &
    WithNode & {
        type: "literal";
        value: PrimitiveType | PrimitiveType[];
        kind: LiteralKind;
    };
export type MapType = WithBoxSymbol & WithNode & { type: "map"; value: MapTypeValue };
export type ListType = WithBoxSymbol & WithNode & { type: "list"; value: BoxNode[] };
export type UnresolvableType = WithBoxSymbol & { type: "unresolvable" };
export type ConditionalType = WithBoxSymbol & WithNode & { type: "conditional"; whenTrue: BoxNode; whenFalse: BoxNode };

// export type PrimitiveBoxNode = ObjectType | LiteralType | MapType
export type BoxNode = ObjectType | LiteralType | MapType | ListType | UnresolvableType | ConditionalType;
export type MapTypeValue = Map<string, BoxNode[]>;

export const isBoxNode = (value: unknown): value is BoxNode => {
    return typeof value === "object" && value !== null && BoxKind in value;
};

const getTypeOfLiteral = (value: PrimitiveType | PrimitiveType[]): LiteralKind => {
    if (Array.isArray(value)) return "array";
    if (typeof value === "string") return "string";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    throw new Error(`Unexpected literal type: ${value as any}`);
};

const boxTypeFactory = {
    object(value: ExtractedPropMap, node: MaybeNode): ObjectType {
        return { [BoxKind]: true, type: "object", value, getNode: () => node };
    },
    literal(value: PrimitiveType | PrimitiveType[], node: MaybeNode): LiteralType {
        return { [BoxKind]: true, type: "literal", value, kind: getTypeOfLiteral(value), getNode: () => node };
    },
    map(value: MapTypeValue, node: Node | Node[]): MapType {
        return { [BoxKind]: true, type: "map", value, getNode: () => node };
    },
    list(value: BoxNode[], node: Node | Node[]): ListType {
        return { [BoxKind]: true, type: "list", value, getNode: () => node };
    },
    conditional(whenTrue: BoxNode, whenFalse: BoxNode, node: MaybeNode): ConditionalType {
        return { [BoxKind]: true, type: "conditional", whenTrue, whenFalse, getNode: () => node };
    },
    cast<T extends BoxNode>(value: unknown, node: MaybeNode): T | undefined {
        if (!value) return;
        if (isBoxNode(value)) return value as T;
        return toBoxType(value as any, node) as T;
    },
    //
    empty: (node: MaybeNode) =>
        ({ [BoxKind]: true, type: "object", value: {}, isEmpty: true, getNode: () => node } as ObjectType),
    unresolvable: (node: MaybeNode) =>
        ({ [BoxKind]: true, type: "unresolvable", getNode: () => node } as UnresolvableType),
};

export const box = boxTypeFactory;

export const isPrimitiveType = (value: unknown): value is PrimitiveType => {
    return typeof value === "string" || typeof value === "number";
};

export type SingleLiteralValue = PrimitiveType | Record<string, unknown>;
export type LiteralValue = SingleLiteralValue | SingleLiteralValue[];

const toBoxType = (
    value: undefined | BoxNode | ExtractedPropMap | PrimitiveType | PrimitiveType[],
    node: MaybeNode
) => {
    if (!isNotNullish(value)) return;
    if (isObject(value) && !Array.isArray(value)) {
        if (isBoxNode(value)) return value;
        return box.object(value, node);
    }

    if (isPrimitiveType(value) || Array.isArray(value)) return box.literal(value, node);
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
    return types;
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

    const literal = box.literal(
        Array.from(literalValues),
        types.flatMap((b) => (b as LiteralType).getNode?.()).filter(isNotNullish)
    );
    // console.dir({ literal, others }, { depth: null });
    return others.concat(literal);
};

export const castObjectLikeAsMapValue = (maybeObject: MaybeObjectLikeBoxReturn, node: MaybeNode): MapTypeValue => {
    if (!maybeObject) return new Map<string, BoxNode[]>();
    if (maybeObject instanceof Map) return maybeObject;
    if (!isBoxNode(maybeObject)) return new Map<string, BoxNode[]>(Object.entries(maybeObject));
    if (maybeObject.type === "map") return maybeObject.value;

    // console.dir({ entries }, { depth: null });
    return new Map<string, BoxNode[]>(
        Object.entries(maybeObject.value).map(([key, value]) => {
            const boxed = box.cast(value, maybeObject.getNode?.() ?? node);
            if (!boxed) return [key, []];
            return [key, [boxed]];
        })
    );
};
