import { createLogger } from "@box-extractor/logger";
import { castAsArray, isObject } from "pastable";
import type {
    ArrayLiteralExpression,
    BinaryExpression,
    ElementAccessExpression,
    Identifier,
    ObjectLiteralElementLike,
    ObjectLiteralExpression,
    PropertyAccessExpression,
    PropertySignature,
    TemplateExpression,
    TypeLiteralNode,
    TypeNode,
} from "ts-morph";
import { Node, ts } from "ts-morph";

import { safeEvaluateNode } from "./evaluate";
// eslint-disable-next-line import/no-cycle
import { getNameLiteral } from "./getNameLiteral";
// eslint-disable-next-line import/no-cycle
import { maybeObjectLikeBox, MaybeObjectLikeBoxReturn } from "./maybeObjectLikeBox";
import { box, BoxNode, BoxNodeLiteral, BoxNodeObject, ConditionalKind, isBoxNode, LiteralValue } from "./type-factory";
import type { ExtractedPropMap, PrimitiveType } from "./types";
import { isNotNullish, unwrapExpression } from "./utils";

const logger = createLogger("box-ex:extractor:maybe-box");
const cacheMap = new WeakMap<Node, MaybeBoxNodeReturn>();

export type MaybeBoxNodeReturn = BoxNode | BoxNode[] | undefined;
export function maybeBoxNode(node: Node, stack: Node[]): MaybeBoxNodeReturn {
    const isCached = cacheMap.has(node);
    logger({ kind: node.getKindName(), isCached });
    if (isCached) return cacheMap.get(node);

    const cache = (value: MaybeBoxNodeReturn) => {
        cacheMap.set(node, value);
        return value;
    };

    // <ColorBox color={"xxx"} />
    if (Node.isStringLiteral(node)) {
        return cache(box.literal(node.getLiteralText(), node, stack));
    }

    // <ColorBox color={[xxx, yyy, zzz]} />
    if (Node.isArrayLiteralExpression(node)) {
        const boxes = node.getElements().map((element) => {
            const maybeBox = maybeBoxNode(element, stack);
            if (!maybeBox) return cache(box.unresolvable(element, stack));

            return Array.isArray(maybeBox) ? box.list(maybeBox, node, stack) : maybeBox;
        });

        return cache(box.list(boxes as any, node, stack));
    }

    // <ColorBox color={`xxx`} />
    if (Node.isNoSubstitutionTemplateLiteral(node)) {
        return cache(box.literal(node.getLiteralText(), node, stack));
    }

    // <ColorBox color={123} />
    if (Node.isNumericLiteral(node)) {
        return cache(box.literal(node.getLiteralText(), node, stack));
    }

    // <ColorBox bool={true} falsy={false} />
    if (Node.isTrueLiteral(node) || Node.isFalseLiteral(node)) {
        return cache(box.literal(node.getLiteralValue(), node, stack));
    }

    // <ColorBox color={staticColor} />
    if (Node.isIdentifier(node)) {
        const value = getIdentifierReferenceValue(node, stack);
        if (isNotNullish(value) && !Node.isNode(value)) {
            return cache(box.cast(value, node, stack));
        }
    }

    if (Node.isTemplateHead(node)) {
        return cache(box.literal(node.getLiteralText(), node, stack));
    }

    // <ColorBox color={`${xxx}yyy`} />
    if (Node.isTemplateExpression(node)) {
        const maybeString = maybeTemplateStringValue(node, stack);
        if (!maybeString) return;

        return cache(box.literal(maybeString, node, stack));
    }

    // <ColorBox color={xxx[yyy]} /> / <ColorBox color={xxx["zzz"]} />
    if (Node.isElementAccessExpression(node)) {
        // TODO cache this & others missed
        return getElementAccessedExpressionValue(node, stack);
    }

    // <ColorBox color={xxx.yyy} />
    if (Node.isPropertyAccessExpression(node)) {
        const evaluated = getPropertyAccessedExpressionValue(node, stack)!;
        return cache(box.cast(evaluated, node, stack));
    }

    // <ColorBox color={isDark ? darkValue : "whiteAlpha.100"} />
    if (Node.isConditionalExpression(node)) {
        const maybeValue = safeEvaluateNode<PrimitiveType | PrimitiveType[] | ExtractedPropMap>(node);
        if (isNotNullish(maybeValue)) return cache(box.cast(maybeValue, node, stack));

        // unresolvable condition will return both possible outcome
        const whenTrueExpr = unwrapExpression(node.getWhenTrue());
        const whenFalseExpr = unwrapExpression(node.getWhenFalse());

        // TODO cache this & others missed
        return maybeExpandConditionalExpression({ whenTrueExpr, whenFalseExpr, node, stack, kind: "ternary" });
    }

    // <ColorBox color={fn()} />
    if (Node.isCallExpression(node)) {
        const maybeValue = safeEvaluateNode<PrimitiveType | ExtractedPropMap>(node);
        return cache(box.cast(maybeValue, node, stack));
    }

    if (Node.isBinaryExpression(node)) {
        const operatorKind = node.getOperatorToken().getKind();
        if (operatorKind === ts.SyntaxKind.PlusToken) {
            const maybeString = tryUnwrapBinaryExpression(node, stack) ?? safeEvaluateNode<string>(node);
            if (!maybeString) return;

            return cache(box.cast(maybeString, node, stack));
        } else if (
            operatorKind === ts.SyntaxKind.BarBarToken ||
            operatorKind === ts.SyntaxKind.QuestionQuestionToken ||
            operatorKind === ts.SyntaxKind.AmpersandAmpersandToken
        ) {
            const whenTrueExpr = unwrapExpression(node.getLeft());
            const whenFalseExpr = unwrapExpression(node.getRight());

            // TODO cache this & others missed
            return maybeExpandConditionalExpression({
                whenTrueExpr,
                whenFalseExpr,
                node,
                stack,
                kind: conditionalKindByOperatorKind[operatorKind],
                canReturnWhenTrue: true,
            });
        }
    }

    // console.log({ maybeBoxNodeEnd: true, expression: node.getText(), kind: node.getKindName() });
}

const conditionalKindByOperatorKind = {
    [ts.SyntaxKind.BarBarToken]: "or" as ConditionalKind,
    [ts.SyntaxKind.QuestionQuestionToken]: "nullish-coalescing" as ConditionalKind,
    [ts.SyntaxKind.AmpersandAmpersandToken]: "and" as ConditionalKind,
};

export const onlyStringLiteral = (boxNode: MaybeBoxNodeReturn) => {
    if (!isNotNullish(boxNode)) return;

    if (isBoxNode(boxNode) && box.isLiteral(boxNode) && typeof boxNode.value === "string") {
        return boxNode;
    }
};

const onlyNumberLiteral = (boxNode: MaybeBoxNodeReturn) => {
    if (!isNotNullish(boxNode)) return;

    if (isBoxNode(boxNode) && box.isLiteral(boxNode) && typeof boxNode.value === "number") {
        return boxNode;
    }
};

// const onlyPrimitiveLiteral = (box: MaybeBoxNodeReturn) => {
//     if (!isNotNullish(box)) return;

//     if (typeof box === "string" || typeof box === "number" || typeof box === "boolean") {
//         return box;
//     }

//     if (isObject(box) && "type" in box && box.type === "literal" && typeof box.value !== "object") {
//         return box.value;
//     }
// };
// const maybePrimitiveLiteral = (node: Node) => onlyPrimitiveLiteral(maybeBoxNode(node));

const maybeStringLiteral = (node: Node, stack: Node[]) => onlyStringLiteral(maybeBoxNode(node, stack));

export const maybePropName = (node: Node, stack: Node[]) => {
    logger.scoped("prop-name", node.getKindName());
    const boxed = maybeBoxNode(node, stack);
    const strBox = onlyStringLiteral(boxed);
    if (strBox) return strBox;

    const numberBox = onlyNumberLiteral(boxed);
    if (numberBox) return numberBox;
};

// <ColorBox color={isDark ? darkValue : "whiteAlpha.100"} />
const maybeExpandConditionalExpression = ({
    whenTrueExpr,
    whenFalseExpr,
    node,
    stack,
    kind,
    canReturnWhenTrue,
}: {
    whenTrueExpr: Node;
    whenFalseExpr: Node;
    node: Node;
    stack: Node[];
    kind: ConditionalKind;
    canReturnWhenTrue?: boolean;
}): BoxNode | BoxNode[] | MaybeObjectLikeBoxReturn => {
    let whenTrueValue: ReturnType<typeof maybeBoxNode> | ReturnType<typeof maybeObjectLikeBox> = maybeBoxNode(
        whenTrueExpr,
        stack
    );
    let whenFalseValue: ReturnType<typeof maybeBoxNode> | ReturnType<typeof maybeObjectLikeBox> = maybeBoxNode(
        whenFalseExpr,
        stack
    );

    logger.scoped("cond", { before: true, whenTrueValue, whenFalseValue });

    // <ColorBox color={isDark ? { mobile: "blue.100", desktop: "blue.300" } : "whiteAlpha.100"} />
    if (!isNotNullish(whenTrueValue)) {
        const maybeObject = maybeObjectLikeBox(whenTrueExpr, stack);
        if (isNotNullish(maybeObject) && !(box.isObject(maybeObject) && maybeObject.isEmpty)) {
            whenTrueValue = maybeObject;
        }
    }

    if (canReturnWhenTrue && isNotNullish(whenTrueValue)) {
        return box.cast(whenTrueValue, whenTrueExpr, stack);
    }

    // <ColorBox color={isDark ? { mobile: "blue.100", desktop: "blue.300" } : "whiteAlpha.100"} />
    if (!isNotNullish(whenFalseValue)) {
        const maybeObject = maybeObjectLikeBox(whenFalseExpr, stack);
        if (isNotNullish(maybeObject) && !(box.isObject(maybeObject) && maybeObject.isEmpty)) {
            whenFalseValue = maybeObject;
        }
    }

    logger.lazyScoped("cond", () => ({
        whenTrueLiteral: whenTrueExpr.getText(),
        whenFalseLiteral: whenFalseExpr.getText(),
        whenTrueValue,
        whenFalseValue,
    }));

    if (!whenTrueValue && !whenFalseValue) {
        return;
    }

    if (whenTrueValue && !whenFalseValue) {
        return box.cast(whenTrueValue, whenTrueExpr, stack);
    }

    if (!whenTrueValue && whenFalseValue) {
        return box.cast(whenFalseValue, whenFalseExpr, stack);
    }

    const whenTrue = whenTrueValue!;
    const whenFalse = whenFalseValue!;

    if (Array.isArray(whenTrue) || Array.isArray(whenFalse)) {
        const merged = castAsArray(whenTrue).concat(whenFalse);
        if (merged.length === 1) return merged[0];

        return merged;
    }

    return box.conditional(whenTrue, whenFalse, node, stack, kind);
};

const findProperty = (node: ObjectLiteralElementLike, propName: string, _stack: Node[]) => {
    const stack = [..._stack];
    logger.scoped("find-prop", { propName, kind: node.getKindName() });

    if (Node.isPropertyAssignment(node)) {
        const name = node.getNameNode();
        // console.log({ name: name.getText(), kind: name.getKindName() });

        if (Node.isIdentifier(name) && name.getText() === propName) {
            stack.push(name);
            return node;
        }

        if (Node.isStringLiteral(name)) {
            stack.push(name);
            return name.getLiteralText();
        }

        if (Node.isComputedPropertyName(name)) {
            const expression = unwrapExpression(name.getExpression());
            const computedPropNameBox = maybePropName(expression, stack);
            if (!computedPropNameBox) return;
            // console.log({ computedPropName, propName, expression: expression.getText() });

            if (String(computedPropNameBox.value) === propName) {
                stack.push(name, expression);
                return node;
            }
        }
    }

    if (Node.isShorthandPropertyAssignment(node)) {
        const name = node.getNameNode();

        if (Node.isIdentifier(name) && name.getText() === propName) {
            stack.push(name);
            return node;
        }
    }
};

const getPropValue = (initializer: ObjectLiteralExpression, propName: string, _stack: Node[]) => {
    const stack = [..._stack];
    const property =
        initializer.getProperty(propName) ?? initializer.getProperties().find((p) => findProperty(p, propName, stack));

    logger.scoped("get-prop", {
        propName,
        // property: property?.getText().slice(0, 100),
        propertyKind: property?.getKindName(),
        // properties: initializer.getProperties().map((p) => p.getText().slice(0, 100)),
        // initializer: initializer.getText().slice(0, 100),
        initializerKind: initializer.getKindName(),
    });

    if (!property) return;
    stack.push(property);

    if (Node.isPropertyAssignment(property)) {
        const propInit = property.getInitializer();
        if (!propInit) return;

        // TODO ?
        const maybePropValue = maybeStringLiteral(propInit, stack);
        if (maybePropValue) {
            return maybePropValue;
        }
    }

    if (Node.isShorthandPropertyAssignment(property)) {
        const propInit = property.getNameNode();
        // TODO ?
        const maybePropValue = maybeStringLiteral(propInit, stack);

        if (maybePropValue) {
            return maybePropValue;
        }
    }
};

const maybeTemplateStringValue = (template: TemplateExpression, stack: Node[]) => {
    const head = template.getHead();
    const tail = template.getTemplateSpans();

    const headValue = maybeStringLiteral(head, stack);
    if (!headValue) return;

    const tailValues = tail.map((t) => {
        const expression = t.getExpression();
        const propBox = maybePropName(expression, stack);
        if (!propBox) return;

        return propBox.value;
    });

    // logger({ head: head.getText(), headValue, tailValues });

    if (tailValues.every(isNotNullish)) {
        // console.log({ propName, headValue, tailValues });
        return headValue.value + tailValues.join("");
    }
};

const maybePropIdentifierDefinitionValue = (
    elementAccessed: Identifier,
    propName: string,
    _stack: Node[]
): BoxNodeLiteral | BoxNodeObject | undefined => {
    const stack = [..._stack];

    const defs = elementAccessed.getDefinitionNodes();
    while (defs.length > 0) {
        const def = unwrapExpression(defs.shift()!);
        logger.scoped("id-def", {
            // def: def?.getText()?.slice(0, 100),
            // elementAccessed: elementAccessed.getText()?.slice(0, 100),
            kind: def?.getKindName(),
            // type: def?.getType().getText()?.slice(0, 100),
            propName,
        });

        stack.push(def);

        if (Node.isVariableDeclaration(def)) {
            const init = def.getInitializer();
            logger.scoped("id-def", {
                initializer: init?.getText(),
                kind: init?.getKindName(),
                propName,
            });

            if (!init) {
                const type = def.getTypeNode();
                if (!type) return;

                if (Node.isTypeLiteral(type)) {
                    const propValue = getTypeLiteralNodePropValue(type, propName, stack);
                    if (isNotNullish(propValue)) {
                        stack.push(type);
                        return box.cast(propValue, type, stack);
                    }
                }

                return;
            }

            const initializer = unwrapExpression(init);
            logger.scoped("id-def", {
                initializer: initializer.getText(),
                kind: initializer.getKindName(),
                propName,
            });

            if (Node.isObjectLiteralExpression(initializer)) {
                const propValue = getPropValue(initializer, propName, stack);
                if (!propValue) return;

                stack.push(initializer);
                return propValue;
            }

            if (Node.isArrayLiteralExpression(initializer)) {
                const index = Number(propName);
                if (Number.isNaN(index)) return;

                const element = initializer.getElements()[index];
                if (!element) return;

                stack.push(initializer);
                const boxed = maybeBoxNode(element, stack);
                if (boxed && isBoxNode(boxed) && box.isLiteral(boxed)) {
                    return boxed;
                }
            }
        }

        if (Node.isBindingElement(def)) {
            const parent = def.getParent();

            logger.scoped("id-def", { parent: parent?.getKindName() });
            if (!parent) return;

            const grandParent = parent.getParent();
            logger.scoped("id-def", { grandParent: grandParent?.getKindName() });
            if (!grandParent) return;

            if (Node.isArrayBindingPattern(parent)) {
                const index = parent.getChildIndex();
                if (Number.isNaN(index)) return;

                if (Node.isVariableDeclaration(grandParent)) {
                    const init = grandParent.getInitializer();
                    logger.scoped("id-def", { grandParentInit: init?.getKindName() });
                    if (!init) return;

                    const initializer = unwrapExpression(init);
                    if (!Node.isArrayLiteralExpression(initializer)) return;

                    const element = initializer.getElements()[index + 1];
                    logger.scoped("id-def", { index, propName, elementKind: element?.getKindName() });
                    if (!element) return;

                    const innerStack = [...stack, initializer, element];
                    const maybeObject = maybeObjectLikeBox(element, innerStack);
                    if (!isNotNullish(maybeObject)) return;

                    if (box.isObject(maybeObject)) {
                        const propValue = maybeObject.value[propName];
                        logger.scoped("id-def", { propName, propValue });

                        return box.cast(propValue, elementAccessed, innerStack);
                    }

                    const propValue = maybeObject.value.get(propName);
                    if (!isNotNullish(propValue)) return;
                    logger.scoped("id-def", { propName, propValue });

                    return box.cast(propValue, elementAccessed, innerStack);
                }
            }

            // TODO ?
            if (Node.isObjectBindingPattern(parent)) {
                //
            }
        }
    }
};

// TODO pass & push in stack ?
const typeLiteralCache = new WeakMap<TypeLiteralNode, null | Map<string, LiteralValue>>();
const getTypeLiteralNodePropValue = (type: TypeLiteralNode, propName: string, stack: Node[]): LiteralValue => {
    if (typeLiteralCache.has(type)) {
        const map = typeLiteralCache.get(type);
        if (map === null) return;

        if (map?.has(propName)) {
            return map.get(propName);
        }
    }

    const members = type.getMembers();
    const prop = members.find((member) => Node.isPropertySignature(member) && member.getName() === propName);

    logger.scoped("type", {
        // prop: prop?.getText().slice(0, 20),
        propKind: prop?.getKindName(),
    });

    if (Node.isPropertySignature(prop) && prop.isReadonly()) {
        const propType = prop.getTypeNode();
        if (!propType) {
            typeLiteralCache.set(type, null);

            return;
        }

        // logger.lazyScoped("type", () => ({
        //     propType: propType.getText().slice(0, 20),
        //     propTypeKind: propType.getKindName(),
        //     propName,
        // }));

        const propValue = getTypeNodeValue(propType, stack);
        logger.scoped("type", { propName, hasPropValue: isNotNullish(propValue) });
        if (isNotNullish(propValue)) {
            if (!typeLiteralCache.has(type)) {
                typeLiteralCache.set(type, new Map());
            }

            const map = typeLiteralCache.get(type)!;
            map.set(propName, propValue);

            return propValue;
        }
    }

    typeLiteralCache.set(type, null);
};

const typeNodeCache = new WeakMap();
const getTypeNodeValue = (type: TypeNode, stack: Node[]): LiteralValue => {
    if (typeNodeCache.has(type)) {
        return typeNodeCache.get(type);
    }

    if (Node.isLiteralTypeNode(type)) {
        const literal = type.getLiteral();
        if (Node.isStringLiteral(literal)) {
            const result = literal.getLiteralText();
            logger.scoped("type-value", { result });
            typeNodeCache.set(type, result);

            return result;
        }
    }

    if (Node.isTypeLiteral(type)) {
        const members = type.getMembers();
        if (!members.some((member) => !Node.isPropertySignature(member) || !member.isReadonly())) {
            const props = members as PropertySignature[];
            const entries = props
                .map((member) => {
                    const nameNode = member.getNameNode();
                    const nameText = nameNode.getText();
                    const name = getNameLiteral(nameNode, stack);
                    logger({ nameNodeKind: nameNode.getKindName(), name });
                    if (!name) return;

                    const value = getTypeLiteralNodePropValue(type, nameText, stack);
                    return [name, value] as const;
                })
                .filter(isNotNullish);

            const result = Object.fromEntries(entries);
            // logger.lazyScoped("type-value", () => ({ obj: Object.keys(obj) }));
            typeNodeCache.set(type, result);

            return result;
        }
    }

    typeNodeCache.set(type, undefined);
};

export const getIdentifierReferenceValue = (identifier: Identifier, _stack: Node[]): MaybeBoxNodeReturn => {
    const defs = identifier.getDefinitionNodes();
    const stack = [..._stack];

    while (defs.length > 0) {
        const def = unwrapExpression(defs.shift()!);

        // logger(({
        //     def: def?.getText(),
        //     identifier: identifier.getText(),
        //     kind: def?.getKindName(),
        //     type: def?.getType().getText(),
        // }));

        stack.push(def);

        // const staticColor =
        if (Node.isVariableDeclaration(def)) {
            const init = def.getInitializer();
            logger.scoped("id-ref", { initializer: init?.getText(), kind: init?.getKindName() });

            if (!init) {
                const type = def.getTypeNode();
                if (!type) return;

                logger.scoped("id-type", { kind: type.getKindName() });
                if (Node.isTypeLiteral(type)) {
                    stack.push(type);
                    const maybeTypeValue = getTypeNodeValue(type, stack);
                    if (isNotNullish(maybeTypeValue)) return box.cast(maybeTypeValue, def, stack);
                }

                return;
            }

            const initializer = unwrapExpression(init);
            const innerStack = [...stack, initializer];
            const maybeValue = maybeBoxNode(initializer, innerStack);
            if (isNotNullish(maybeValue)) return maybeValue;

            if (Node.isObjectLiteralExpression(initializer)) {
                logger.scoped("get-id-value");
                return maybeObjectLikeBox(initializer, innerStack);
            }

            // logger(({
            //     getIdentifierReferenceValue: true,
            //     def: def?.getText(),
            //     identifier: identifier.getText(),
            //     kind: def?.getKindName(),
            //     type: def?.getType().getText(),
            //     initializer: initializer?.getText(),
            //     initializerKind: initializer?.getKindName(),
            // }));
        }
    }
};

const tryUnwrapBinaryExpression = (node: BinaryExpression, stack: Node[]) => {
    const left = unwrapExpression(node.getLeft());
    const right = unwrapExpression(node.getRight());

    const leftValue = maybePropName(left, stack);
    const rightValue = maybePropName(right, stack);
    if (!leftValue || !rightValue) return;

    // console.log({
    //     leftValue,
    //     rightValue,
    //     left: [left.getKindName(), left.getText()],
    //     right: [right.getKindName(), right.getText()],
    // });

    if (isNotNullish(leftValue.value) && isNotNullish(rightValue.value)) {
        return box.literal(String(leftValue.value) + String(rightValue.value), node, stack);
    }
};

const elAccessedLogger = logger.extend("element-access");

const getElementAccessedExpressionValue = (expression: ElementAccessExpression, _stack: Node[]): MaybeBoxNodeReturn => {
    const elementAccessed = unwrapExpression(expression.getExpression());
    const argExpr = expression.getArgumentExpression();
    if (!argExpr) return;

    const arg = unwrapExpression(argExpr);
    const stack = [..._stack, elementAccessed, arg];
    const argLiteral = maybePropName(arg, stack);

    elAccessedLogger.lazy(() => ({
        arg: arg.getText(),
        argKind: arg.getKindName(),
        elementAccessed: elementAccessed.getText(),
        elementAccessedKind: elementAccessed.getKindName(),
        expression: expression.getText(),
        expressionKind: expression.getKindName(),
        argLiteral,
    }));

    // <ColorBox color={xxx["yyy"]} />
    if (Node.isIdentifier(elementAccessed) && isNotNullish(argLiteral)) {
        if (!isNotNullish(argLiteral.value)) return;

        const maybeValue = maybePropIdentifierDefinitionValue(elementAccessed, argLiteral.value.toString(), stack);
        if (!maybeValue) return;

        return box.cast(maybeValue, expression, stack);
    }

    // <ColorBox color={xxx[yyy + "zzz"]} />
    if (Node.isBinaryExpression(arg)) {
        if (arg.getOperatorToken().getKind() !== ts.SyntaxKind.PlusToken) return;

        const propName = tryUnwrapBinaryExpression(arg, stack) ?? maybePropName(arg, stack);

        if (isNotNullish(propName) && Node.isIdentifier(elementAccessed)) {
            if (!isNotNullish(propName.value)) return;

            const maybeValue = maybePropIdentifierDefinitionValue(elementAccessed, propName.value.toString(), stack);
            if (!maybeValue) return;

            return box.cast(maybeValue, expression, stack);
        }
    }

    // <ColorBox color={xxx[`yyy`]} />
    if (Node.isTemplateExpression(arg)) {
        const propName = maybeTemplateStringValue(arg, stack);

        if (isNotNullish(propName) && Node.isIdentifier(elementAccessed)) {
            const maybeValue = maybePropIdentifierDefinitionValue(elementAccessed, propName, stack);
            if (!maybeValue) return;

            return box.cast(maybeValue, expression, stack);
        }
    }

    // <ColorBox color={{ staticColor: "facebook.900" }["staticColor"]}></ColorBox>
    if (Node.isObjectLiteralExpression(elementAccessed) && isNotNullish(argLiteral)) {
        if (!isNotNullish(argLiteral.value)) return;

        return getPropValue(elementAccessed, argLiteral.value.toString(), stack);
    }

    // <ColorBox color={xxx[yyy.zzz]} />
    if (Node.isPropertyAccessExpression(arg)) {
        const propValue = getPropertyAccessedExpressionValue(arg, stack);
        return box.cast(propValue, arg, stack);
    }

    // <ColorBox color={xxx[yyy[zzz]]} />
    if (Node.isIdentifier(elementAccessed) && Node.isElementAccessExpression(arg)) {
        const propName = getElementAccessedExpressionValue(arg, stack);
        elAccessedLogger({ isArgElementAccessExpression: true, propName });

        if (typeof propName === "string" && isNotNullish(propName)) {
            const maybeValue = maybePropIdentifierDefinitionValue(elementAccessed, propName, stack);
            if (!maybeValue) return;

            return box.cast(maybeValue, expression, stack);
        }
    }

    // <ColorBox color={xxx[yyy[zzz]]} />
    if (Node.isElementAccessExpression(elementAccessed) && isNotNullish(argLiteral) && isNotNullish(argLiteral.value)) {
        const identifier = getElementAccessedExpressionValue(elementAccessed, stack);
        elAccessedLogger({ isElementAccessExpression: true, identifier, argValue: argLiteral });

        if (isObject(identifier) && !Array.isArray(identifier)) {
            const argValue = argLiteral.value.toString();

            if (box.isMap(identifier)) {
                const maybeValue = identifier.value.get(argValue);
                elAccessedLogger({ isElementAccessExpression: true, maybeValue });
                if (maybeValue) {
                    const first = Array.isArray(maybeValue) ? maybeValue[0] : maybeValue;
                    return isBoxNode(first) ? first : box.cast(first, expression, stack);
                }

                if (!maybeValue) return;
            }

            if (box.isObject(identifier)) {
                const maybeValue = identifier.value[argValue];
                elAccessedLogger({ isElementAccessExpression: true, maybeValue });
                if (maybeValue) {
                    const first = Array.isArray(maybeValue) ? maybeValue[0] : maybeValue;
                    return isBoxNode(first) ? first : box.cast(first, expression, stack);
                }

                if (!maybeValue) return;
            }
        }
    }

    // <ColorBox color={xxx[[yyy][zzz]]} />
    if (Node.isArrayLiteralExpression(elementAccessed) && isNotNullish(argLiteral)) {
        return getArrayElementValueAtIndex(elementAccessed, Number(argLiteral.value), stack);
    }

    // <ColorBox color={xxx[aaa ? yyy : zzz]]} />
    if (Node.isConditionalExpression(arg)) {
        // TODO maybePropName ?
        const propName = maybeStringLiteral(arg, stack);
        elAccessedLogger({ isConditionalExpression: true, propName });
        // eslint-disable-next-line sonarjs/no-collapsible-if
        if (isNotNullish(propName) && isNotNullish(propName.value)) {
            // eslint-disable-next-line unicorn/no-lonely-if
            if (Node.isIdentifier(elementAccessed)) {
                const maybeValue = maybePropIdentifierDefinitionValue(
                    elementAccessed,
                    propName.value.toString(),
                    stack
                );
                if (!maybeValue) return;

                return box.cast(maybeValue, expression, stack);
            }
        }

        const whenTrueExpr = unwrapExpression(arg.getWhenTrue());
        const whenFalseExpr = unwrapExpression(arg.getWhenFalse());

        // TODO ?
        const whenTrueValue = maybeStringLiteral(whenTrueExpr, stack);
        const whenFalseValue = maybeStringLiteral(whenFalseExpr, stack);

        elAccessedLogger({
            conditionalElementAccessed: true,
            whenTrueValue,
            whenFalseValue,
            whenTrue: [whenTrueExpr.getKindName(), whenTrueExpr.getText()],
            whenFalse: [whenFalseExpr.getKindName(), whenFalseExpr.getText()],
        });

        if (Node.isIdentifier(elementAccessed)) {
            const whenTrueResolved =
                isNotNullish(whenTrueValue) && isNotNullish(whenTrueValue.value)
                    ? maybePropIdentifierDefinitionValue(elementAccessed, whenTrueValue.value.toString(), stack)
                    : undefined;
            const whenFalseResolved =
                isNotNullish(whenFalseValue) && isNotNullish(whenFalseValue.value)
                    ? maybePropIdentifierDefinitionValue(elementAccessed, whenFalseValue.value.toString(), stack)
                    : undefined;

            if (!whenTrueResolved && !whenFalseResolved) {
                return;
            }

            if (whenTrueResolved && !whenFalseResolved) {
                return box.cast(whenTrueResolved, whenTrueExpr, stack);
            }

            if (!whenTrueResolved && whenFalseResolved) {
                return box.cast(whenFalseResolved, whenFalseExpr, stack);
            }

            const whenTrue = box.cast(whenTrueResolved, whenTrueExpr, stack)!;
            const whenFalse = box.cast(whenFalseResolved, whenFalseExpr, stack)!;

            return box.conditional(whenTrue, whenFalse, arg, stack, "ternary");
        }
    }
};

const getArrayElementValueAtIndex = (array: ArrayLiteralExpression, index: number, stack: Node[]) => {
    const element = array.getElements()[index];
    if (!element) return;

    const value = maybeBoxNode(element, stack);
    elAccessedLogger({
        array: array.getText(),
        arrayKind: array.getKindName(),
        element: element.getText(),
        elementKind: element.getKindName(),
        value,
        obj: maybeObjectLikeBox(element, stack),
    });

    if (isNotNullish(value)) {
        return value;
    }

    if (Node.isObjectLiteralExpression(element)) {
        return maybeObjectLikeBox(element, stack);
    }
};

const getPropertyAccessedExpressionValue = (
    expression: PropertyAccessExpression,
    stack: Node[]
): BoxNode | undefined => {
    const propName = expression.getName();
    const elementAccessed = unwrapExpression(expression.getExpression());

    logger.scoped("prop-access-value", {
        propName,
        // elementAccessed: elementAccessed.getText().slice(0, 100),
        elementAccessedKind: elementAccessed.getKindName(),
    });
    stack.push(elementAccessed);

    if (Node.isIdentifier(elementAccessed)) {
        return box.cast(maybePropIdentifierDefinitionValue(elementAccessed, propName, stack), elementAccessed, stack);
    }

    if (Node.isPropertyAccessExpression(elementAccessed)) {
        const propValue = getPropertyAccessedExpressionValue(elementAccessed, stack);
        if (isNotNullish(propValue) && box.isObject(propValue)) {
            return box.cast(propValue.value[propName], elementAccessed, stack);
        }
    }

    // TODO evaluate as fallback instead of upfront everywhere possible
    const maybeValue = safeEvaluateNode<PrimitiveType | PrimitiveType[] | ExtractedPropMap>(expression);
    logger.scoped("prop-access-value", { maybeValue: Boolean(maybeValue) });
    if (isNotNullish(maybeValue)) return box.cast(maybeValue, expression, stack);
};
