// = find all usage via vs-code
// https://github.com/dsherret/ts-morph/issues/299

import { createLogger } from "@box-extractor/logger";
import {
    BindingName,
    Identifier,
    JsxElement,
    JsxExpression,
    JsxFragment,
    JsxOpeningElement,
    JsxSelfClosingElement,
    Node,
    PropertyName,
    SourceFile,
    StringLiteral,
    ts,
} from "ts-morph";
import { query } from "./extract";
import { getNameLiteral, unquote } from "./getNameLiteral";
import type { ExtractOptions } from "./types";
import { unwrapExpression } from "./utils";

// :matches(JsxOpeningElement, JsxSelfClosingElement):has(Identifier[name="Box"])

// TODO find all Box components used from a sprinkles fn + find all sprinkles fn used
const logger = createLogger("box-ex:finder:components");

// const CustomBox = ({ render, ...props }) => <Box {...props} >{render()}</Box>;
//                                             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
const getJsxComponentWithSpreadByName = (ast: SourceFile, name: string) =>
    query<JsxOpeningElement | JsxSelfClosingElement>(
        ast,
        `:matches(JsxOpeningElement, JsxSelfClosingElement):has(Identifier[name="${name}"]):has(JsxAttributes:has(JsxSpreadAttribute))`
    );

export type FindAllTransitiveComponentsOptions = Pick<ExtractOptions, "ast"> & {
    components: string[];
    transitiveMap: Map<string, { from: string | null; referencedBy: Set<string>; refUsedWithSpread: Set<string> }>;
};

export const findAllTransitiveComponents = ({ transitiveMap, ...options }: FindAllTransitiveComponentsOptions) => {
    logger({ components: options.components });
    const namesWithSpread = new Set<string>();

    options.components.forEach((component) => {
        if (!transitiveMap.has(component)) {
            transitiveMap.set(component, { from: null, referencedBy: new Set(), refUsedWithSpread: new Set() });
        }

        const referencedBy = transitiveMap.get(component)!.referencedBy;
        const refUsedWithSpread = transitiveMap.get(component)!.refUsedWithSpread;

        const jsxNodes = getJsxComponentWithSpreadByName(options.ast, component);
        // console.log(new Set(jsxNodes.map((jsxNode) => getAncestorComponent(jsxNode)?.getText())));

        const wrapperNodes = new Map<string, ReturnType<typeof getAncestorComponent>>();
        jsxNodes.forEach((jsxNode) => {
            const wrapper = getAncestorComponent(jsxNode) as Identifier | StringLiteral;
            if (!wrapper) return;

            const nameLiteral = getNameLiteral(wrapper, []);
            if (!nameLiteral) return;

            const name = unquote(nameLiteral);
            if (!name) return;
            if (wrapperNodes.has(name) || options.components.includes(name)) return;

            const parent = wrapper.getParent();
            const isComputed = Node.isComputedPropertyName(parent);
            const hasSpread = jsxNode.getAttributes().some((attr) => Node.isJsxSpreadAttribute(attr));

            logger({
                name,
                wrapperKind: wrapper.getKindName(),
                parentKind: parent.getKindName(),
                isComputed,
                hasSpread,
            });

            wrapperNodes.set(name, wrapper);
            referencedBy.add(name);

            if (hasSpread) {
                namesWithSpread.add(name);
                refUsedWithSpread.add(name);
                transitiveMap.set(name, { from: component, referencedBy: new Set(), refUsedWithSpread: new Set() });
            }
        });

        // logger.lazy(() => ({
        //     namesWithRefs: Array.from(wrapperNodes.entries())
        //         // .filter(([, { refs }]) => refs.length === 0)
        //         .map(([name, { refs }]) => [name, refs.map((ref) => ref.getText())] as [string, string[]]),
        // }));
    });

    if (namesWithSpread.size > 0) {
        logger({ namesWithSpread });
        const transitiveComponents = findAllTransitiveComponents({
            components: Array.from(namesWithSpread),
            ast: options.ast,
            transitiveMap,
        });
        transitiveComponents.forEach((name) => namesWithSpread.add(name));
        logger({ transitiveComponents, namesWithSpread, from: options.components });
    }

    return namesWithSpread;
};

export function getAncestorComponent(node: Node) {
    let result: Node | undefined;

    node.getParentWhile((node) => {
        // function Component() { return <div>aaa</div> }
        // const Component = function () { return <div>aaa</div> }
        if (Node.isFunctionDeclaration(node) || Node.isFunctionExpression(node)) {
            const returnStms = node.getBody()?.getChildrenOfKind(ts.SyntaxKind.ReturnStatement);
            for (const returnStm of returnStms ?? []) {
                const expression = unwrapExpression(returnStm);
                const value = unwrapExpression(expression.getChildAtIndex(1));

                if (isJsx(value)) {
                    result = node;
                    return false;
                }
            }

            return true;
        }

        // const Component = () => <div>aaa</div>
        if (Node.isArrowFunction(node)) {
            const body = node.getBody();

            // const Component = () => { return ((<div>aaa</div>) as any) };
            if (Node.isBlock(body)) {
                const returnStms = body.getChildrenOfKind(ts.SyntaxKind.ReturnStatement);
                for (const returnStm of returnStms ?? []) {
                    const expression = unwrapExpression(returnStm);
                    const value = unwrapExpression(expression.getChildAtIndex(1));

                    if (isJsx(value)) {
                        result = node;
                        return false;
                    }
                }

                return true;
            }

            // body has an implicit return but is maybe wrapped in a parenthesized/as expression etc
            // const Component = () => ((<div>aaa</div>) as any)
            const expression = unwrapExpression(body);

            // now we can check if the body is a jsx element
            // const Component = () => <div>aaa</div>
            //                         ^^^^^^^^^^^^^^
            if (isJsx(expression)) {
                result = node;
                return false;
            }

            return true;
        }

        return true;
    });

    // console.log({
    //     node: node.getText(),
    //     nodeKind: node.getKindName(),
    //     result: result?.getText(),
    // });

    if (!result) return;

    // const Component = function () { return <div>aaa</div> }
    // const Component = () => <div>aaa</div>
    if (Node.isFunctionExpression(result) || Node.isArrowFunction(result)) {
        const parent = result.getParent();
        // console.log({
        //     parent: parent?.getText(),
        //     parentKind: parent?.getKindName(),
        // });

        if (Node.isVariableDeclaration(parent)) {
            return parent.getNameNode();
        }

        if (Node.isPropertyAssignment(parent)) {
            const nameNode = unwrapName(parent.getNameNode());

            const grandParent = parent.getParent();
            const prevSibling = grandParent
                .getPreviousSiblings()
                .find((sibling) => Node.isObjectBindingPattern(sibling));
            // console.log({
            //     grandParent: grandParent?.getText(),
            //     grandParentKind: grandParent?.getKindName(),
            //     prevSibling: prevSibling?.getText(),
            //     prevSiblingKind: prevSibling?.getKindName(),
            //     siblings: grandParent.getPreviousSiblings().map((sibling) => sibling.getText()),
            // });

            // const { ObjectBindingSomething } = { ObjectBindingSomething: (props) => <ColorBox color="red.100" {...props} /> };
            if (prevSibling && Node.isObjectBindingPattern(prevSibling)) {
                const bindingElement = prevSibling
                    .getElements()
                    .find((el) => el.getNameNode().getText() === nameNode?.getText());

                if (bindingElement) {
                    return bindingElement.getNameNode();
                }

                return bindingElement;
            }

            // const componentsMap = { Something: (props) => <ColorBox color="red.100" {...props} /> };
            return nameNode;
        }

        // const [RandomName] = [(props) => <ColorBox color="orange.400" {...props} />]
        if (Node.isArrayLiteralExpression(parent)) {
            const index = result.getChildIndex();
            const prevSibling = parent.getPreviousSiblings().find((sibling) => Node.isArrayBindingPattern(sibling));

            // console.log({
            //     parent: parent.getText(),
            //     parentKind: parent.getKindName(),
            //     arrayBinding: prevSibling?.getText(),
            //     arrayBindingKind: prevSibling?.getKindName(),
            // });
            if (!prevSibling || !Node.isArrayBindingPattern(prevSibling)) return;

            const element = prevSibling.getElements().at(index);
            if (!element || Node.isOmittedExpression(element)) return;

            // console.log({
            //     element: element.getText(),
            //     elementKind: element.getKindName(),
            // });

            return unwrapName(element.getNameNode());
        }

        // console.log({
        //     parent: parent.getText(),
        //     parentKind: parent.getKindName(),
        //     result: result?.getText(),
        // });
    }

    // function Component() { return <div>aaa</div> }
    if (Node.isFunctionDeclaration(result)) {
        return result.getNameNode();
    }
}

const unwrapName = (node: PropertyName | BindingName) => {
    // { propName: "value" }
    if (Node.isIdentifier(node) || Node.isStringLiteral(node)) return node;

    // { [computed]: "value" }
    if (Node.isComputedPropertyName(node)) return unwrapExpression(node.getExpression());
};

const isJsxNamedComponent = (node: Node): node is JsxOpeningElement | JsxSelfClosingElement => {
    return Node.isJsxOpeningElement(node) || Node.isJsxSelfClosingElement(node);
};

const isJsx = (
    node: Node
): node is JsxOpeningElement | JsxSelfClosingElement | JsxFragment | JsxElement | JsxExpression => {
    return (
        Node.isJsxOpeningElement(node) ||
        Node.isJsxSelfClosingElement(node) ||
        Node.isJsxFragment(node) ||
        Node.isJsxElement(node) ||
        Node.isJsxExpression(node)
    );
};
