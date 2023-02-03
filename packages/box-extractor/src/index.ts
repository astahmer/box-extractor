export { ensureAbsolute } from "./extensions-helpers";
export { extract, query } from "./extractor/extract";
export { extractCallExpressionValues } from "./extractor/extractCallExpressionIdentifierValues";
export { extractFunctionFrom, isImportedFrom } from "./extractor/extractFunctionFrom";
export { extractJsxAttributeIdentifierValue } from "./extractor/extractJsxAttributeIdentifierValue";
export { extractJsxSpreadAttributeValues } from "./extractor/extractJsxSpreadAttributeValues";
export type { FindAllTransitiveComponentsOptions } from "./extractor/findAllTransitiveComponents";
export { findAllTransitiveComponents, getAncestorComponent } from "./extractor/findAllTransitiveComponents";
export { getBoxLiteralValue } from "./extractor/getBoxLiteralValue";
export { getNameLiteral, unquote } from "./extractor/getNameLiteral";
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
    isPrimitiveType,
} from "./extractor/type-factory";
export type {
    BoxNodesMap,
    ComponentNodesMap,
    Extractable,
    ExtractableMap,
    ExtractOptions,
    FunctionNodesMap,
    PrimitiveType,
    PropNodesMap,
    QueryComponentBox,
    QueryFnBox,
} from "./extractor/types";
export { castAsExtractableMap, unwrapExpression } from "./extractor/utils";
