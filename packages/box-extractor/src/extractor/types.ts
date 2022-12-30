import type { SourceFile } from "ts-morph";
import type { BoxNode, LiteralValue } from "./type-factory";

// https://github.com/vanilla-extract-css/vanilla-extract/discussions/91#discussioncomment-2653340
// critical css = Box context + collect
// accidentally extractable tailwind classNames ?
// also remove unused variants from https://vanilla-extract.style/documentation/packages/recipes/ ?

// TODO mv to type-factory
export type PrimitiveType = string | number;
export type ExtractedPropMap = Record<string, LiteralValue>;

export type PropNodeMap = { kind: "component" | "function"; nodes: Map<string, BoxNode[]> };
export type NodeMap = Map<string, PropNodeMap>;

export type ListOrAll = "all" | string[];
export type ExtractOptions = {
    ast: SourceFile;
    components?: Record<string, { properties: ListOrAll }> | string[];
    functions?: Record<string, { properties: ListOrAll }> | string[];
    used: NodeMap;
};
