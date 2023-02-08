import type { CallExpression, JsxOpeningElement, JsxSelfClosingElement, SourceFile } from "ts-morph";
import type { BoxNode, BoxNodeList, BoxNodeMap, LiteralValue } from "./type-factory";

// https://github.com/vanilla-extract-css/vanilla-extract/discussions/91#discussioncomment-2653340
// critical css = Box context + collect
// accidentally extractable tailwind classNames ?
// also remove unused variants from https://vanilla-extract.style/documentation/packages/recipes/ ?

export type PrimitiveType = string | number | boolean | null | undefined;
export type ExtractedPropMap = Record<string, LiteralValue>;

export type BoxNodeMapKind = "component" | "function";

export type QueryFnBox = { name: string; fromNode: () => CallExpression; box: BoxNodeList };
export type FunctionNodesMap = { kind: "function"; nodesByProp: Map<string, BoxNode[]>; queryList: QueryFnBox[] };

export type QueryComponentBox = {
    name: string;
    fromNode: () => JsxOpeningElement | JsxSelfClosingElement;
    box: BoxNodeMap;
};
export type ComponentNodesMap = {
    kind: "component";
    nodesByProp: Map<string, BoxNode[]>;
    queryList: QueryComponentBox[];
};

// TODO rename
export type PropNodesMap = ComponentNodesMap | FunctionNodesMap;
export type BoxNodesMap = Map<string, PropNodesMap>;

export type ListOrAll = "all" | string[];
export type ExtractOptions = {
    ast: SourceFile;
    components?: Extractable;
    functions?: Extractable;
    extractMap?: BoxNodesMap;
};

export type ExtractableMap = Record<string, { properties: ListOrAll }>;
export type Extractable = ExtractableMap | string[];
