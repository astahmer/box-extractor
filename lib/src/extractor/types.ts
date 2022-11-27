import type { SourceFile } from "ts-morph";

// https://github.com/TheMightyPenguin/dessert-box/pull/23
// https://github.com/vanilla-extract-css/vanilla-extract/discussions/91#discussioncomment-2653340
// critical css = Box context + collect
// accidentally extractable tailwind classNames ?
// also remove unused variants from https://vanilla-extract.style/documentation/packages/recipes/ ?

export type ComponentUsedPropertiesStyle = {
    properties: Map<string, Set<string>>;
    conditionalProperties: Map<string, Map<string, Set<string>>>;
};
export type UsedComponentsMap = Map<string, ComponentUsedPropertiesStyle>;

export type ExtractedComponentProperties = [componentName: string, propPairs: ExtractedPropPair[]];
export type ExtractedPropPair = [propName: string, propValue: string | string[]];
export type ExtractedPropMap = Record<string, string | string[]>;

export type ExtractOptions = {
    ast: SourceFile;
    components: Record<string, { properties: string[]; conditions: string[] }>;
    functions?: Record<string, { properties: string[] }>;
    used: UsedComponentsMap;
};
