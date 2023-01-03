import type { SourceFile } from "ts-morph";
import type { BoxNode, LiteralValue } from "./type-factory";

// https://github.com/vanilla-extract-css/vanilla-extract/discussions/91#discussioncomment-2653340
// critical css = Box context + collect
// accidentally extractable tailwind classNames ?
// also remove unused variants from https://vanilla-extract.style/documentation/packages/recipes/ ?

export type PrimitiveType = string | number;
export type ExtractedPropMap = Record<string, LiteralValue>;

export type PropNodesMap = { kind: "component" | "function"; nodesByProp: Map<string, BoxNode[]> };
export type BoxNodesMap = Map<string, PropNodesMap>;

export type ListOrAll = "all" | string[];
export type ExtractOptions = {
    ast: SourceFile;
    components?: Record<string, { properties: ListOrAll }> | string[];
    functions?: Record<string, { properties: ListOrAll }> | string[];
    extractMap: BoxNodesMap;
};
