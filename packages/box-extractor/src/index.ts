export { ensureAbsolute } from "./extensions-helpers";
export { extract, query } from "./extractor/extract";
export { extractCallExpressionValues } from "./extractor/extractCallExpressionValues";
export { extractFunctionFrom, isImportedFrom } from "./extractor/extractFunctionFrom";
export { extractJsxAttributeIdentifierValue } from "./extractor/extractJsxAttributeIdentifierValue";
export { extractJsxSpreadAttributeValues } from "./extractor/extractJsxSpreadAttributeValues";
export type {
    FindAllTransitiveComponentsOptions,
    TransitiveInfo,
    TransitiveMap,
} from "./extractor/findAllTransitiveComponents";
export { findAllTransitiveComponents, getAncestorComponent } from "./extractor/findAllTransitiveComponents";
export { getBoxLiteralValue } from "./extractor/getBoxLiteralValue";
export type { MaybeBoxNodeReturn } from "./extractor/maybeBoxNode";
export { getNameLiteral, maybeBoxNode } from "./extractor/maybeBoxNode";
export type {
    BoxNode,
    ConditionalType,
    EmptyInitializerType,
    ListType,
    LiteralType,
    LiteralValue,
    MapType,
    MapTypeValue,
    ObjectType,
    SingleLiteralValue,
} from "./extractor/type-factory";
export {
    box,
    BoxNodeConditional,
    BoxNodeEmptyInitializer,
    BoxNodeList,
    BoxNodeLiteral,
    BoxNodeMap,
    BoxNodeObject,
    BoxNodeUnresolvable,
    isBoxNode,
    isPrimitiveType,
} from "./extractor/type-factory";
export type {
    Extractable,
    ExtractableMap,
    ExtractedComponentInstance,
    ExtractedComponentResult,
    ExtractedFunctionInstance,
    ExtractedFunctionResult,
    ExtractOptions,
    ExtractResultByName,
    ExtractResultItem,
    PrimitiveType,
} from "./extractor/types";
export { unbox } from "./extractor/unbox";
export { castAsExtractableMap, unquote, unwrapExpression } from "./extractor/utils";
export { visitBoxNode } from "./extractor/visitBoxNode";
