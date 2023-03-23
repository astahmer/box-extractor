export { extract } from "./extractor/extract";
export { extractAtRange, extractJsxElementProps } from "./extractor/extractAtRange";
export { extractCallExpressionArguments } from "./extractor/extractCallExpressionArguments";
export { extractFunctionFrom, isImportedFrom } from "./extractor/extractFunctionFrom";
export { extractJsxAttribute } from "./extractor/extractJsxAttribute";
export { extractJsxSpreadAttributeValues } from "./extractor/extractJsxSpreadAttributeValues";
export type {
    FindAllTransitiveComponentsOptions,
    TransitiveInfo,
    TransitiveMap,
} from "./extractor/findAllTransitiveComponents";
export { findAllTransitiveComponents, getAncestorComponent } from "./extractor/findAllTransitiveComponents";
export { findIdentifierValueDeclaration, getDeclarationFor, isScope } from "./extractor/findIdentifierValueDeclaration";
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
    BoxContext,
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
export { unquote, unwrapExpression } from "./extractor/utils";
export { visitBoxNode } from "./extractor/visitBoxNode";
