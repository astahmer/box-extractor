import { isObject } from "pastable";
import type { Node } from "ts-morph";
import type { MaybeObjectLikeBoxReturn } from "./maybeObjectLikeBox";
import type { ExtractedPropMap, PrimitiveType } from "./types";
import { isNotNullish } from "./utils";

type WithNode = { node: Node; stack: Node[] };

export type ObjectType = WithNode & { type: "object"; value: ExtractedPropMap; isEmpty?: boolean };
export type LiteralKind = "array" | "string" | "number" | "boolean" | "null" | "undefined";
export type LiteralType = WithNode & {
    type: "literal";
    value: PrimitiveType;
    kind: LiteralKind;
};
export type MapType = WithNode & { type: "map"; value: MapTypeValue };
export type ListType = WithNode & { type: "list"; value: BoxNode[] };
export type UnresolvableType = WithNode & { type: "unresolvable" };
export type ConditionalKind = "ternary" | "and" | "or" | "nullish-coalescing";
export type ConditionalType = WithNode & {
    type: "conditional";
    whenTrue: BoxNode;
    whenFalse: BoxNode;
    kind: ConditionalKind;
};
export type EmptyInitializerType = WithNode & { type: "empty-initializer" };

// export type PrimitiveBoxNode = ObjectType | LiteralType | MapType
export type BoxNodeType =
    | ObjectType
    | LiteralType
    | MapType
    | ListType
    | UnresolvableType
    | ConditionalType
    | EmptyInitializerType;
export type MapTypeValue = Map<string, BoxNode[]>;

export abstract class BoxNode<Definition extends BoxNodeType = BoxNodeType> {
    public readonly type: Definition["type"];
    private readonly stack: Node[] = [];
    private readonly node: Definition["node"];

    constructor(definition: Definition) {
        this.type = definition.type;
        this.node = definition.node;
        this.stack = [...(definition.stack ?? [])];
    }

    getNode(): Node {
        return this.node;
    }

    getStack(): Node[] {
        return this.stack;
    }
}

export class BoxNodeObject extends BoxNode<ObjectType> {
    public value: ObjectType["value"];
    public isEmpty: ObjectType["isEmpty"];
    constructor(definition: ObjectType) {
        super(definition);
        this.value = definition.value;
        this.isEmpty = definition.isEmpty;
    }
}

export class BoxNodeLiteral extends BoxNode<LiteralType> {
    public value: LiteralType["value"];
    public kind: LiteralType["kind"];
    constructor(definition: LiteralType) {
        super(definition);
        this.value = definition.value;
        this.kind = definition.kind;
    }
}

export class BoxNodeMap extends BoxNode<MapType> {
    public value: MapType["value"];
    constructor(definition: MapType) {
        super(definition);
        this.value = definition.value;
    }
}

export class BoxNodeList extends BoxNode<ListType> {
    public value: ListType["value"];
    constructor(definition: ListType) {
        super(definition);
        this.value = definition.value;
    }
}

export class BoxNodeUnresolvable extends BoxNode<UnresolvableType> {
    // constructor(definition: UnresolvableType) {
    //     super(definition);
    // }
}

export class BoxNodeConditional extends BoxNode<ConditionalType> {
    public whenTrue: ConditionalType["whenTrue"];
    public whenFalse: ConditionalType["whenFalse"];
    public kind: ConditionalType["kind"];
    constructor(definition: ConditionalType) {
        super(definition);
        this.whenTrue = definition.whenTrue;
        this.whenFalse = definition.whenFalse;
        this.kind = definition.kind;
    }
}

export class BoxNodeEmptyInitializer extends BoxNode<EmptyInitializerType> {
    // constructor(definition: EmptyInitializerType) {
    //     super(definition);
    // }
}

export const isBoxNode = (value: unknown): value is BoxNode => value instanceof BoxNode;

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
    object(value: ExtractedPropMap, node: Node, stack: Node[]) {
        return new BoxNodeObject({ type: "object", value, node, stack });
    },
    literal(value: PrimitiveType, node: Node, stack: Node[]) {
        return new BoxNodeLiteral({ type: "literal", value, kind: getTypeOfLiteral(value), node, stack });
    },
    map(value: MapTypeValue, node: Node, stack: Node[]) {
        return new BoxNodeMap({ type: "map", value, node, stack });
    },
    list(value: BoxNode[], node: Node, stack: Node[]) {
        return new BoxNodeList({ type: "list", value, node, stack });
    },
    conditional(whenTrue: BoxNode, whenFalse: BoxNode, node: Node, stack: Node[], kind: ConditionalKind) {
        return new BoxNodeConditional({ type: "conditional", whenTrue, whenFalse, kind, node, stack });
    },
    cast<T>(value: T, node: Node, stack: Node[]) {
        if (isBoxNode(value)) {
            return value as T extends BoxNode<infer Type> ? BoxNode<Type> : never;
        }

        // @ts-expect-error
        return toBoxType(value, node, stack);
    },
    //
    emptyObject: (node: Node, stack: Node[]) => {
        return new BoxNodeObject({ type: "object", value: {}, isEmpty: true, node, stack });
    },
    emptyInitializer: (node: Node, stack: Node[]) => {
        return new BoxNodeEmptyInitializer({ type: "empty-initializer", node, stack });
    },
    unresolvable: (node: Node, stack: Node[]) => {
        return new BoxNodeUnresolvable({ type: "unresolvable", node, stack });
    },
    // asserts
    isObject(value: BoxNode): value is BoxNodeObject {
        return value.type === "object";
    },
    isLiteral(value: BoxNode): value is BoxNodeLiteral {
        return value.type === "literal";
    },
    isMap(value: BoxNode): value is BoxNodeMap {
        return value.type === "map";
    },
    isList(value: BoxNode): value is BoxNodeList {
        return value.type === "list";
    },
    isUnresolvable(value: BoxNode): value is BoxNodeUnresolvable {
        return value.type === "unresolvable";
    },
    isConditional(value: BoxNode): value is BoxNodeConditional {
        return value.type === "conditional";
    },
    isEmptyInitializer(value: BoxNode): value is BoxNodeEmptyInitializer {
        return value.type === "empty-initializer";
    },
};

export const box = boxTypeFactory;

export const isPrimitiveType = (value: unknown): value is PrimitiveType => {
    return typeof value === "string" || typeof value === "number";
};

export type LiteralObject = Record<string, unknown>;
export type SingleLiteralValue = PrimitiveType | LiteralObject;
export type LiteralValue = SingleLiteralValue | SingleLiteralValue[];

// function toBoxType<Value extends BoxNode>(value: Value, node: Node, stack: Node[]): Value;
function toBoxType<Value extends PrimitiveType>(value: Value, node: Node, stack: Node[]): BoxNodeLiteral;
function toBoxType<Value extends ExtractedPropMap>(value: Value, node: Node, stack: Node[]): BoxNodeObject;
function toBoxType<Value extends PrimitiveType[]>(value: Value, node: Node, stack: Node[]): BoxNodeLiteral[];
// function toBoxType<Value extends LiteralObject>(value: Value, node: Node, stack: Node[]):  BoxNodeObject;
// function toBoxType<Value extends LiteralValue>(value: Value, node: Node, stack: Node[]):  BoxNodeLiteral | BoxNodeObject;
// function toBoxType<Value extends undefined>(value: Value, node: Node, stack: Node[]): Value;
// function toBoxType(value: undefined | BoxNode | ExtractedPropMap | PrimitiveType | PrimitiveType[], node: Node):  BoxNode | BoxNode[] | LiteralType[] | undefined;
function toBoxType<Value>(value: Value, node: Node, stack: Node[]): BoxNode | BoxNode[] | LiteralType[] | undefined {
    if (!isNotNullish(value)) return;
    if (isBoxNode(value)) return value;

    if (isObject(value) && !Array.isArray(value)) {
        return box.object(value as ExtractedPropMap, node, stack);
    }

    if (Array.isArray(value)) {
        if (value.length === 1) return toBoxType(value[0], node, stack);
        return value.map((item) => toBoxType(item, node, stack) as BoxNode);
    }

    if (isPrimitiveType(value)) return box.literal(value, node, stack);
}

export const castObjectLikeAsMapValue = (maybeObject: MaybeObjectLikeBoxReturn, node: Node): MapTypeValue => {
    if (!maybeObject) return new Map<string, BoxNode[]>();
    if (maybeObject instanceof Map) return maybeObject;
    if (!isBoxNode(maybeObject)) return new Map<string, BoxNode[]>(Object.entries(maybeObject));
    if (box.isMap(maybeObject)) return maybeObject.value;

    // console.dir({ entries }, { depth: null });
    return new Map<string, BoxNode[]>(
        Object.entries(maybeObject.value).map(([key, value]) => {
            const boxed = box.cast(value, maybeObject.getNode() ?? node, maybeObject.getStack() ?? []);
            if (!boxed) return [key, []];
            return [key, [boxed]];
        })
    );
};
