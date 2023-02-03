import { isObject } from "pastable";
import type { Node } from "ts-morph";
import type { MaybeObjectLikeBoxReturn } from "./maybeObjectLikeBox";
import type { ExtractedPropMap, PrimitiveType } from "./types";
import { isNotNullish } from "./utils";

const BoxKind = Symbol("BoxNode");
type WithBoxSymbol = { [BoxKind]: true; getNode: () => Node; fromNode: () => Node };

export type ObjectType = WithBoxSymbol & { type: "object"; value: ExtractedPropMap; isEmpty?: boolean };
export type LiteralKind = "array" | "string" | "number" | "boolean" | "null" | "undefined";
export type LiteralType = WithBoxSymbol & {
    type: "literal";
    value: PrimitiveType;
    kind: LiteralKind;
};
export type MapType = WithBoxSymbol & { type: "map"; value: MapTypeValue };
export type ListType = WithBoxSymbol & { type: "list"; value: BoxNode[] };
export type UnresolvableType = WithBoxSymbol & { type: "unresolvable" };
export type ConditionalKind = "ternary" | "and" | "or" | "nullish-coalescing";
export type ConditionalType = WithBoxSymbol & {
    type: "conditional";
    whenTrue: BoxNode;
    whenFalse: BoxNode;
    kind: ConditionalKind;
};
export type EmptyInitializerType = WithBoxSymbol & { type: "empty-initializer" };

// export type PrimitiveBoxNode = ObjectType | LiteralType | MapType
export type BoxNode =
    | ObjectType
    | LiteralType
    | MapType
    | ListType
    | UnresolvableType
    | ConditionalType
    | EmptyInitializerType;
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
    object(value: ExtractedPropMap, node: Node) {
        return { [BoxKind]: true, type: "object", value, getNode: () => node } as ObjectType;
    },
    literal(value: PrimitiveType, node: Node) {
        return {
            [BoxKind]: true,
            type: "literal",
            value,
            kind: getTypeOfLiteral(value),
            getNode: () => node,
        } as LiteralType;
    },
    map(value: MapTypeValue, node: Node) {
        return { [BoxKind]: true, type: "map", value, getNode: () => node } as MapType;
    },
    list(value: BoxNode[], node: Node) {
        return { [BoxKind]: true, type: "list", value, getNode: () => node } as ListType;
    },
    conditional(whenTrue: BoxNode, whenFalse: BoxNode, node: Node, kind: ConditionalKind) {
        return {
            [BoxKind]: true,
            type: "conditional",
            whenTrue,
            whenFalse,
            kind,
            getNode: () => node,
        } as ConditionalType;
    },
    cast<T extends BoxNode>(value: unknown, node: Node): T | undefined {
        if (!value) return;
        if (isBoxNode(value)) return value as T;
        return toBoxType(value as any, node) as T;
    },
    //
    emptyObject: (node: Node) =>
        ({ [BoxKind]: true, type: "object", value: {}, isEmpty: true, getNode: () => node } as ObjectType),
    emptyInitializer: (node: Node) =>
        ({ [BoxKind]: true, type: "empty-initializer", getNode: () => node } as EmptyInitializerType),
    unresolvable: (node: Node) => ({ [BoxKind]: true, type: "unresolvable", getNode: () => node } as UnresolvableType),
};

export const box = boxTypeFactory;

export const isPrimitiveType = (value: unknown): value is PrimitiveType => {
    return typeof value === "string" || typeof value === "number";
};

export type SingleLiteralValue = PrimitiveType | Record<string, unknown>;
export type LiteralValue = SingleLiteralValue | SingleLiteralValue[];

const toBoxType = (
    value: undefined | BoxNode | ExtractedPropMap | PrimitiveType | PrimitiveType[],
    node: Node
): BoxNode | BoxNode[] | LiteralType[] | undefined => {
    if (!isNotNullish(value)) return;
    if (isObject(value) && !Array.isArray(value)) {
        if (isBoxNode(value)) return value;
        return box.object(value, node);
    }

    if (Array.isArray(value)) {
        if (value.length === 1) return toBoxType(value[0], node);
        return value.map((item) => toBoxType(item, node) as BoxNode);
    }

    if (isPrimitiveType(value)) return box.literal(value, node);
};

export const castObjectLikeAsMapValue = (maybeObject: MaybeObjectLikeBoxReturn, node: Node): MapTypeValue => {
    if (!maybeObject) return new Map<string, BoxNode[]>();
    if (maybeObject instanceof Map) return maybeObject;
    if (!isBoxNode(maybeObject)) return new Map<string, BoxNode[]>(Object.entries(maybeObject));
    if (maybeObject.type === "map") return maybeObject.value;

    // console.dir({ entries }, { depth: null });
    return new Map<string, BoxNode[]>(
        Object.entries(maybeObject.value).map(([key, value]) => {
            const boxed = box.cast(value, maybeObject.getNode() ?? node);
            if (!boxed) return [key, []];
            return [key, [boxed]];
        })
    );
};
