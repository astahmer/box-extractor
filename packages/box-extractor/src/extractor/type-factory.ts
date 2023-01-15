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
        value: PrimitiveType;
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
    literal(value: PrimitiveType, node: MaybeNode): LiteralType {
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

    if (Array.isArray(value)) return value.map((item) => box.literal(item, node));
    if (isPrimitiveType(value)) return box.literal(value, node);
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
