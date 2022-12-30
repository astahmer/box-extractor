import type { SourceFile } from "ts-morph";
import type { ExtractedType, LiteralValue } from "./type-factory";

// https://github.com/TheMightyPenguin/dessert-box/pull/23
// https://github.com/vanilla-extract-css/vanilla-extract/discussions/91#discussioncomment-2653340
// critical css = Box context + collect
// accidentally extractable tailwind classNames ?
// also remove unused variants from https://vanilla-extract.style/documentation/packages/recipes/ ?

// TODO mv to type-factory
export type PrimitiveType = string | number;
export type ExtractedPropMap = Record<string, LiteralValue>;

export type ComponentUsedPropertiesStyle = {
    properties: Map<string, Set<LiteralValue>>;
    entries: Map<string, Map<string, Set<LiteralValue>>>;
    //
    literals: Map<string, Set<LiteralValue>>;
    nodes: Map<string, ExtractedType[]>;
};
export type UsedComponentsMap = Map<string, ComponentUsedPropertiesStyle>;

export type ExtractedComponentProperties = [componentName: string, propPairs: ExtractedPropPair[]];
export type ExtractedPropPair = [propName: string, propValue: ExtractedType[]];

export type ListOrAll = "all" | string[];
export type ExtractOptions = {
    ast: SourceFile;
    components?: Record<string, { properties: ListOrAll }> | string[];
    functions?: Record<string, { properties: ListOrAll }> | string[];
    used: UsedComponentsMap;
};
