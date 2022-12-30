// = find all usage via vs-code
// https://github.com/dsherret/ts-morph/issues/299

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
import { getIdentifierReferenceValue, onlyStringLiteral } from "./maybeBoxNode";
import type { ExtractOptions } from "./types";
import { unwrapExpression } from "./utils";

// :matches(JsxOpeningElement, JsxSelfClosingElement):has(Identifier[name="Box"])

// TODO find all Box components used from a sprinkles fn + find all sprinkles fn used

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
    // console.log({ findAllTransitiveComponents: true });
    const namesWithSpread = new Set<string>();

    options.components.forEach((component) => {
        // console.log(component);
        if (!transitiveMap.has(component)) {
            transitiveMap.set(component, { from: null, referencedBy: new Set(), refUsedWithSpread: new Set() });
        }

        const referencedBy = transitiveMap.get(component)!.referencedBy;
        const refUsedWithSpread = transitiveMap.get(component)!.refUsedWithSpread;

        const jsxNodes = getJsxComponentWithSpreadByName(options.ast, component);
        // console.log(new Set(jsxNodes.map((jsxNode) => getAncestorComponent(jsxNode)?.getText())));

        const wrapperNodes = new Map<string, { node: ReturnType<typeof getAncestorComponent>; refs: Node[] }>();
        jsxNodes.forEach((jsxNode) => {
            const wrapper = getAncestorComponent(jsxNode) as Identifier | StringLiteral;
            if (!wrapper) return;

            const name = getNameLiteral(wrapper);
            // console.log({
            //     wrapper: wrapper.getText(),
            //     wrapperKind: wrapper.getKindName(),
            //     name,
            //     // has: wrapperNodes.has(name),
            //     // includes: options.components.includes(name),
            // });
            if (wrapperNodes.has(name) || options.components.includes(name)) return;

            const parent = wrapper.getParent();
            const isComputed = Node.isComputedPropertyName(parent);

            let refs = [] as Node[];
            // console.log({ isComputed, parent: parent?.getText(), parentKind: parent?.getKindName() });
            if (Node.isIdentifier(wrapper) && !isComputed) {
                // console.log({ name, wrapperKind: wrapper.getKindName() });
                refs = wrapper.findReferencesAsNodes().reduce((acc, ref) => {
                    if (Node.isIdentifier(ref)) {
                        // <Something color="red.200" />
                        let parent = ref.getParent();

                        // <componentsMap.Something color="red.200" />
                        if (Node.isPropertyAccessExpression(parent) && parent.getParent()) {
                            parent = parent.getParent()!;
                        }

                        // console.log({
                        //     parent: parent.getText(),
                        //     parentKind: parent.getKindName(),
                        // });
                        if (
                            isJsxNamedComponent(parent) &&
                            parent.getAttributes().some((attr) => Node.isJsxSpreadAttribute(attr))
                        ) {
                            return acc.concat(parent);
                        }
                    }

                    return acc;
                }, [] as Node[]);
            } else if (Node.isStringLiteral(wrapper) || (Node.isIdentifier(wrapper) && isComputed)) {
                // TODO wrapper is exported -> options.ast.getProject().getSourceFiles() ?
                refs = getJsxComponentWithSpreadByName(options.ast, name);
                // console.log(refs.map((ref) => ref.getText()));
            } else {
                console.warn({ todo: true, name, wrapperKind: wrapper.getKindName() });
            }

            wrapperNodes.set(name, { node: wrapper, refs });
            referencedBy.add(name);

            if (refs.length > 0) {
                namesWithSpread.add(name);
                refUsedWithSpread.add(name);
                transitiveMap.set(name, { from: component, referencedBy: new Set(), refUsedWithSpread: new Set() });
            }
        });

        // const namesWithRefs = Array.from(wrapperNodes.entries())
        //     // .filter(([, { refs }]) => refs.length === 0)
        //     .map(([name, { refs }]) => [name, refs.map((ref) => ref.getText())] as [string, string[]]);

        // console.log({ namesWithRefs });
        // console.log({ names, components: Array.from(names) });
    });

    // TODO map sur ce set (unique by name) de nodes puis findReferencesAsNodes sur chacun
    // et filtrer sur seulement ceux qui ont un spread = :has(JsxAttributes:has(JsxSpreadAttribute))
    // puis de nouveau getAncestorComponent sur chacun -> unique by name -> findReferencesAsNodes -> etc
    if (namesWithSpread.size > 0) {
        // console.log({ namesWithSpread });
        const transitiveComponents = findAllTransitiveComponents({
            components: Array.from(namesWithSpread),
            ast: options.ast,
            transitiveMap,
        });
        transitiveComponents.forEach((name) => namesWithSpread.add(name));
        // console.log({ transitiveComponents, namesWithSpread, from: options.components });
    }

    // transitiveComponents.forEach((name) => void names.add(name));
    // console.log({ transitiveComponents, names, from: options.components });
    // console.log({ names, namesWithSpread });

    return namesWithSpread;
};

function getNameLiteral(wrapper: Node) {
    if (Node.isStringLiteral(wrapper)) return wrapper.getLiteralText();
    if (Node.isIdentifier(wrapper)) {
        const maybeValue = getIdentifierReferenceValue(wrapper);
        if (!maybeValue) return wrapper.getText();

        const value = onlyStringLiteral(maybeValue);
        if (value) return value;
        return wrapper.getText();
    }

    return unquote(wrapper.getText());
}

function getAncestorComponent(node: Node) {
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

const unquote = (str: string) => {
    if (str.startsWith('"') && str.endsWith('"')) return str.slice(1, -1);
    if (str.startsWith("'") && str.endsWith("'")) return str.slice(1, -1);
    return str;
};

/**
 * @see adapted from https://github.com/noahbuscher/react-tsdoc/blob/6231f6be0caf43bcafc32ded14f13f18fbcb54a1/src/utils/reactComponentHelper.ts#L14
 */
const isReactComponentDefinition = (node: Node): boolean => {
    if (Node.isVariableDeclaration(node) || Node.isFunctionDeclaration(node)) {
        const name = node.getName();
        if (!name) return false;

        const first = name[0];
        if (!first) return false;

        return first === first.toUpperCase();
    }

    return false;
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
