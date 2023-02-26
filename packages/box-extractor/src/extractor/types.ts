import type { CallExpression, JsxOpeningElement, JsxSelfClosingElement, SourceFile } from "ts-morph";
import type { BoxNode, BoxNodeList, BoxNodeMap, LiteralValue } from "./type-factory";

export type PrimitiveType = string | number | boolean | null | undefined;
export type EvaluatedObjectResult = Record<string, LiteralValue>;

export type ExtractResultKind = "component" | "function";

export type ExtractedFunctionInstance = { name: string; fromNode: () => CallExpression; box: BoxNodeList };
export type ExtractedFunctionResult = {
    kind: "function";
    nodesByProp: Map<string, BoxNode[]>;
    queryList: ExtractedFunctionInstance[];
};

export type ExtractedComponentInstance = {
    name: string;
    fromNode: () => JsxOpeningElement | JsxSelfClosingElement;
    box: BoxNodeMap;
};
export type ExtractedComponentResult = {
    kind: "component";
    nodesByProp: Map<string, BoxNode[]>;
    queryList: ExtractedComponentInstance[];
};

export type ExtractResultItem = ExtractedComponentResult | ExtractedFunctionResult;
export type ExtractResultByName = Map<string, ExtractResultItem>;

export type ListOrAll = "all" | string[];
export type ExtractOptions = {
    ast: SourceFile;
    components?: Extractable;
    functions?: Extractable;
    extractMap?: ExtractResultByName;
};

export type ExtractableMap = Record<string, { properties: ListOrAll }>;
export type Extractable = ExtractableMap | string[];
