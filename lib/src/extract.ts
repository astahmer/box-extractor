import { tsquery } from "@phenomnomnominal/tsquery";
import { castAsArray, isObjectLiteral } from "pastable";
import { evaluate } from "ts-evaluator";
import {
    ArrayLiteralExpression,
    BinaryExpression,
    ElementAccessExpression,
    Expression,
    Identifier,
    JsxSpreadAttribute,
    Node,
    ObjectLiteralElementLike,
    ObjectLiteralExpression,
    PropertyAccessExpression,
    SourceFile,
    TemplateExpression,
    ts,
    Type,
    TypeChecker,
} from "ts-morph";

// https://github.com/TheMightyPenguin/dessert-box/pull/23
// https://github.com/vanilla-extract-css/vanilla-extract/discussions/91#discussioncomment-2653340

// critical css = Box context + collect

// accidentally extractable tailwind classNames ?
// also remove unused variants from https://vanilla-extract.style/documentation/packages/recipes/ ?

type Nullable<T> = T | null | undefined;

const isNotNullish = <T>(element: Nullable<T>): element is T => element != null;

type ComponentUsedPropertiesStyle = {
    properties: Map<string, Set<string>>;
};
export type UsedMap = Map<string, ComponentUsedPropertiesStyle>;

type ExtractedComponentProperties = [componentName: string, propPairs: ExtractedPropPair[]];
type ExtractedPropPair = [propName: string, propValue: string | string[]];

export type ExtractOptions = {
    ast: SourceFile;
    config: Record<string, string[]>;
    used: UsedMap;
};

// TODO runtime sprinkles fn
// TODO rename maybeStringLiteral with maybeSingularLiteral ? (NumericLiteral, StringLiteral)

export const extract = ({ ast, config, used }: ExtractOptions) => {
    const componentPropValues: ExtractedComponentProperties[] = [];

    Object.entries(config).forEach(([componentName, propNameList]) => {
        const extractedComponentPropValues = [] as ExtractedPropPair[];
        componentPropValues.push([componentName, extractedComponentPropValues]);

        // console.log(selector);
        if (!used.has(componentName)) {
            used.set(componentName, { properties: new Map() });
        }

        const componentMap = used.get(componentName)!;

        const propIdentifier = `Identifier[name=/${propNameList.join("|")}/]`;
        const selector = `JsxElement:has(Identifier[name="${componentName}"]) JsxAttribute > ${propIdentifier}`;
        // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
        //           ^^^^^           ^^^^^^^^^^^^^^^

        const identifierNodesFromJsxAttribute = query<Identifier>(ast, selector) ?? [];
        identifierNodesFromJsxAttribute.forEach((node) => {
            const propName = node.getText();
            const propValues = componentMap.properties.get(propName) ?? new Set();

            if (!componentMap.properties.has(propName)) {
                componentMap.properties.set(propName, propValues);
            }

            const extracted = extractJsxAttributeIdentifierValue(node);
            const extractedValues = castAsArray(extracted).filter(isNotNullish);
            extractedValues.forEach((value) => {
                if (typeof value === "string") {
                    propValues.add(value);
                }
            });

            extractedComponentPropValues.push([propName, extracted] as ExtractedPropPair);
        });

        const spreadSelector = `JsxElement:has(Identifier[name="${componentName}"]) JsxSpreadAttribute`;
        const spreadNodes = query<JsxSpreadAttribute>(ast, spreadSelector) ?? [];
        spreadNodes.forEach((node) => {
            const extracted = extractJsxSpreadAttributeValues(node);
            const foundPropList = new Set<string>();

            // reverse prop entries so that the last one wins
            // ex: <Box sx={{ ...{ color: "red" }, color: "blue" }} />
            // color: "blue" wins / color: "red" is ignored
            const entries = extracted.reverse().filter(([propName]) => {
                if (!propNameList.includes(propName)) return false;
                if (foundPropList.has(propName)) return false;

                foundPropList.add(propName);
                return true;
            });

            // console.log(extracted);

            // reverse again to keep the original order
            entries.reverse().forEach(([propName, propValue]) => {
                const propValues = componentMap.properties.get(propName) ?? new Set();

                if (!componentMap.properties.has(propName)) {
                    componentMap.properties.set(propName, propValues);
                }

                const extractedValues = castAsArray(propValue).filter(isNotNullish);
                extractedValues.forEach((value) => {
                    if (typeof value === "string") {
                        propValues.add(value);
                        extractedComponentPropValues.push([propName, value]);
                    }
                });
            });

            return entries;
        });

        // console.log(extractedComponentPropValues);

        // console.log(
        //     identifierNodesFromJsxAttribute.map((n) => [n.getParent().getText(), extractJsxAttributeIdentifierValue(n)])
        //     // .filter((v) => !v[v.length - 1])
        // );
    });

    return componentPropValues;
};

const parseType = (type: Type) => {
    const text = type.getText().replace(/["']/g, "").split(" | ");
    return text.length > 1 ? text : text[0];
};

const extractJsxAttributeIdentifierValue = (identifier: Identifier) => {
    // console.log(n.getText(), n.parent.getText());
    const parent = identifier.getParent();
    if (!Node.isJsxAttribute(parent)) return;
    // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
    //           ^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // identifier = `color` (and then backgroundColor)
    // parent = `color="red.200"` (and then backgroundColor="blackAlpha.100")

    const initializer = parent.getInitializer();
    if (!initializer) return;

    if (Node.isStringLiteral(initializer)) {
        // initializer = `"red.200"` (and then "blackAlpha.100")

        return initializer.getLiteralText();
    }

    // <ColorBox color={xxx} />
    if (Node.isJsxExpression(initializer)) {
        const expression = unwrapExpression(initializer.getExpressionOrThrow());
        if (!expression) return;

        // console.log("expr", expression.getKindName(), expression.getText());

        const maybeValue = maybeLiteral(expression);
        if (isNotNullish(maybeValue)) return maybeValue;

        const type = expression.getType();
        if (type.isLiteral() || type.isUnionOrIntersection()) return parseType(type);

        // unresolvable condition (isDark) will return both possible outcome
        // const [isDark, setIsDark] = useColorMode();
        // <ColorBox color={isDark ? darkValue : "whiteAlpha.100"} />
        if (Node.isConditionalExpression(expression)) {
            return [maybeLiteral(expression.getWhenTrue()), maybeLiteral(expression.getWhenFalse())].flat();
        }
    }
};

const extractJsxSpreadAttributeValues = (spreadAttribute: JsxSpreadAttribute) => {
    const node = unwrapExpression(spreadAttribute.getExpression());

    const maybeEntries = maybeObjectEntries(node);
    if (isNotNullish(maybeEntries)) return maybeEntries;

    return [];
};

const getObjectLiteralExpressionPropPairs = (expression: ObjectLiteralExpression) => {
    const extractedPropValues = [] as ExtractedPropPair[];

    const properties = expression.getProperties();
    properties.forEach((propElement) => {
        if (Node.isPropertyAssignment(propElement) || Node.isShorthandPropertyAssignment(propElement)) {
            const propName = getPropertyName(propElement);
            if (!propName) return;

            const initializer = unwrapExpression(propElement.getInitializerOrThrow());
            const maybeValue = maybeStringLiteral(initializer);

            if (isNotNullish(maybeValue)) {
                extractedPropValues.push([propName, maybeValue]);
                return;
            }

            const type = initializer.getType();
            if (type.isLiteral() || type.isUnionOrIntersection()) {
                const extracted = parseType(type);

                if (isNotNullish(extracted)) {
                    if (typeof extracted === "string") {
                        extractedPropValues.push([propName, extracted]);
                        return;
                    }

                    if (!Array.isArray(extracted)) return;

                    extracted.forEach((possibleValue) => {
                        extractedPropValues.push([propName, possibleValue]);
                    });
                }
            }
        }

        if (Node.isSpreadAssignment(propElement)) {
            const initializer = unwrapExpression(propElement.getExpression());
            const extracted = maybeObjectEntries(initializer);
            if (extracted) {
                extracted.forEach(([propName, value]) => {
                    extractedPropValues.push([propName, value]);
                });
            }
        }
    });

    return extractedPropValues;
};

const getPropertyName = (property: ObjectLiteralElementLike) => {
    if (Node.isPropertyAssignment(property)) {
        const node = unwrapExpression(property.getNameNode());

        // { propName: "value" }
        if (Node.isIdentifier(node)) {
            return node.getText();
        }

        // { [computed]: "value" }
        if (Node.isComputedPropertyName(node)) {
            const expression = node.getExpression();
            const computedPropName = maybeStringLiteral(expression);
            if (isNotNullish(computedPropName)) return computedPropName;
        }
    }

    // { shorthand }
    if (Node.isShorthandPropertyAssignment(property)) {
        const name = property.getName();
        if (isNotNullish(name)) return name;
    }
};

/**
 * whenTrue: [ [ 'color', 'never.250' ] ],
 * whenFalse: [ [ 'color', [ 'salmon.850', 'salmon.900' ] ] ],
 * merged: [ [ 'color', [ 'never.250', 'salmon.850', 'salmon.900' ] ] ]
 */
const mergePossibleEntries = (whenTrue: ExtractedPropPair[], whenFalse: ExtractedPropPair[]) => {
    const merged = new Map<string, Set<string>>();

    whenTrue.forEach(([propName, propValues]) => {
        const whenFalsePairWithPropName = whenFalse.find(([prop]) => prop === propName);
        if (whenFalsePairWithPropName) {
            merged.set(propName, new Set([...castAsArray(propValues), ...castAsArray(whenFalsePairWithPropName[1])]));
            return;
        }

        merged.set(propName, new Set(castAsArray(propValues)));
    });

    whenFalse.forEach(([propName, propValues]) => {
        if (merged.has(propName)) return;

        const whenTruePairWithPropName = whenTrue.find(([prop]) => prop === propName);
        if (whenTruePairWithPropName) {
            merged.set(propName, new Set([...castAsArray(propValues), ...castAsArray(whenTruePairWithPropName[1])]));
            return;
        }

        merged.set(propName, new Set(castAsArray(propValues)));
    });

    return Array.from(merged.entries()).map(([propName, propValues]) => [
        propName,
        Array.from(propValues),
    ]) as ExtractedPropPair[];
};

const maybeObjectEntries = (node: Node): ExtractedPropPair[] | undefined => {
    if (Node.isObjectLiteralExpression(node)) {
        return getObjectLiteralExpressionPropPairs(node);
    }

    // <ColorBox {...xxx} />
    if (Node.isIdentifier(node)) {
        const maybeObject = getIdentifierReferenceValue(node);
        if (!maybeObject || !Node.isNode(maybeObject)) return [];

        // <ColorBox {...objectLiteral} />
        if (Node.isObjectLiteralExpression(maybeObject)) {
            return getObjectLiteralExpressionPropPairs(maybeObject);
        }
    }

    // <ColorBox {...(xxx ? yyy : zzz)} />
    if (Node.isConditionalExpression(node)) {
        const maybeObject = evaluateNode(node);

        // fallback to both possible outcome
        if (maybeObject === EvalError) {
            const whenTrue = maybeObjectEntries(node.getWhenTrue()) ?? [];
            const whenFalse = maybeObjectEntries(node.getWhenFalse()) ?? [];
            return mergePossibleEntries(whenTrue, whenFalse);
        }

        if (isNotNullish(maybeObject) && isObjectLiteral(maybeObject)) {
            return Object.entries(maybeObject);
        }

        return [];
    }

    // <ColorBox {...(condition && objectLiteral)} />
    if (Node.isBinaryExpression(node) && node.getOperatorToken().getKind() === ts.SyntaxKind.AmpersandAmpersandToken) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return [];

        if (isObjectLiteral(maybeObject)) {
            return Object.entries(maybeObject);
        }
    }

    if (Node.isCallExpression(node)) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return [];

        if (isObjectLiteral(maybeObject)) {
            return Object.entries(maybeObject);
        }
    }

    if (Node.isPropertyAccessExpression(node)) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return [];

        if (isObjectLiteral(maybeObject)) {
            return Object.entries(maybeObject);
        }
    }

    if (Node.isElementAccessExpression(node)) {
        const maybeObject = safeEvaluateNode(node);
        if (!maybeObject) return [];

        if (isObjectLiteral(maybeObject)) {
            return Object.entries(maybeObject);
        }
    }
};

const findProperty = (node: ObjectLiteralElementLike, propName: string) => {
    if (Node.isPropertyAssignment(node)) {
        const name = node.getNameNode();

        if (Node.isIdentifier(name) && name.getText() === propName) {
            return node;
        }

        if (Node.isComputedPropertyName(name)) {
            const expression = name.getExpression();
            const computedPropName = maybeLiteral(expression);

            if (computedPropName === propName) {
                return node;
            }
        }
    }

    if (Node.isShorthandPropertyAssignment(node)) {
        const name = node.getNameNode();
        if (Node.isIdentifier(name) && name.getText() === propName) {
            return node;
        }
    }
};

const getPropValue = (initializer: ObjectLiteralExpression, propName: string) => {
    const property =
        initializer.getProperty(propName) ?? initializer.getProperties().find((p) => findProperty(p, propName));

    // console.log("props", {
    //     propName,
    //     property: property?.getText(),
    //     properties: initializer.getProperties().map((p) => p.getText()),
    //     propertyKind: property?.getKindName(),
    //     initializer: initializer.getText(),
    //     initializerKind: initializer.getKindName(),
    // });

    if (Node.isPropertyAssignment(property)) {
        const propInit = property.getInitializerOrThrow();
        const maybePropValue = maybeStringLiteral(propInit);

        if (maybePropValue) {
            return maybePropValue;
        }
    }

    if (Node.isShorthandPropertyAssignment(property)) {
        const propInit = property.getNameNode();
        const maybePropValue = maybeStringLiteral(propInit);

        if (maybePropValue) {
            return maybePropValue;
        }
    }
};

const maybeTemplateStringValue = (template: TemplateExpression) => {
    const head = template.getHead();
    const tail = template.getTemplateSpans();

    const headValue = maybeStringLiteral(head);
    const tailValues = tail.map((t) => {
        const expression = t.getExpression();
        return maybeLiteral(expression);
    });

    // console.log({ headValue, tailValues });

    if (isNotNullish(headValue) && tailValues.every(isNotNullish)) {
        // console.log({ propName, headValue, tailValues });
        return headValue + tailValues.join("");
    }
};

const maybePropIdentifierDefinitionValue = (elementAccessed: Identifier, propName: string) => {
    const defs = elementAccessed.getDefinitionNodes();
    while (defs.length > 0) {
        const def = unwrapExpression(defs.shift()!);
        // console.log({
        //     def: def?.getText(),
        //     elementAccessed: elementAccessed.getText(),
        //     kind: def?.getKindName(),
        //     type: def?.getType().getText(),
        //     propName,
        // });

        if (Node.isVariableDeclaration(def)) {
            const initializer = unwrapExpression(def.getInitializerOrThrow());

            if (Node.isObjectLiteralExpression(initializer)) {
                return getPropValue(initializer, propName);
            }

            if (Node.isArrayLiteralExpression(initializer)) {
                const index = Number(propName);
                if (Number.isNaN(index)) return;

                const element = initializer.getElements()[index];
                if (!element) return;

                return maybeStringLiteral(element);
            }
        }
    }
};

function maybeLiteral(node: Node): string | string[] | ObjectLiteralExpression | undefined {
    // <ColorBox color={"xxx"} />
    if (Node.isStringLiteral(node)) {
        return node.getLiteralText();
    }

    // <ColorBox color={`xxx`} />
    if (Node.isNoSubstitutionTemplateLiteral(node)) {
        return node.getLiteralText();
    }

    // <ColorBox color={123} />
    if (Node.isNumericLiteral(node)) {
        return node.getLiteralText();
    }

    // <ColorBox color={staticColor} />
    if (Node.isIdentifier(node)) {
        const value = getIdentifierReferenceValue(node);
        if (isNotNullish(value) && !Node.isNode(value)) {
            return value;
        }
    }

    if (Node.isTemplateHead(node)) {
        return node.getLiteralText();
    }

    // <ColorBox color={`${xxx}yyy`} />
    if (Node.isTemplateExpression(node)) {
        return maybeTemplateStringValue(node);
    }

    // <ColorBox color={xxx[yyy]} /> / <ColorBox color={xxx["zzz"]} />
    if (Node.isElementAccessExpression(node)) {
        return getElementAccessedExpressionValue(node);
    }

    // <ColorBox color={xxx.yyy} />
    if (Node.isPropertyAccessExpression(node)) {
        return getPropertyAccessedExpressionValue(node)!;
    }

    // <ColorBox color={isDark ? darkValue : "whiteAlpha.100"} />
    if (Node.isConditionalExpression(node)) {
        return safeEvaluateNode<string>(node);
    }

    // <ColorBox color={fn()} />
    if (Node.isCallExpression(node)) {
        return safeEvaluateNode<string>(node);
    }

    if (Node.isBinaryExpression(node)) {
        return tryUnwrapBinaryExpression(node) ?? safeEvaluateNode<string>(node);
    }

    // console.log({ maybeLiteralEnd: true, node: node.getText(), kind: node.getKindName() });
}

const maybeStringLiteral = (node: Node) => {
    const literal = maybeLiteral(node);
    if (typeof literal === "string") {
        return literal;
    }
};

const unwrapExpression = (node: Node): Node => {
    if (Node.isAsExpression(node)) {
        return unwrapExpression(node.getExpression());
    }

    if (Node.isParenthesizedExpression(node)) {
        return unwrapExpression(node.getExpression());
    }

    if (Node.isNonNullExpression(node)) {
        return unwrapExpression(node.getExpression());
    }

    if (Node.isTypeAssertion(node)) {
        return unwrapExpression(node.getExpression());
    }

    return node;
};

// const getObjectFromIdentifier = (identifier: Identifier) => {
//     const defs = identifier.getDefinitionNodes();
//     while (defs.length > 0) {
//         const def = unwrapExpression(defs.shift()!);

//     }

const getIdentifierReferenceValue = (identifier: Identifier) => {
    const defs = identifier.getDefinitionNodes();
    while (defs.length > 0) {
        const def = unwrapExpression(defs.shift()!);

        // console.log({
        //     def: def?.getText(),
        //     identifier: identifier.getText(),
        //     kind: def?.getKindName(),
        //     type: def?.getType().getText(),
        // });

        // const staticColor =
        if (Node.isVariableDeclaration(def)) {
            const initializer = unwrapExpression(def.getInitializerOrThrow());

            const maybeValue = maybeLiteral(initializer);
            if (isNotNullish(maybeValue)) return maybeValue;

            const type = initializer.getType();
            if (type.isLiteral() || type.isUnionOrIntersection()) return parseType(type);

            if (Node.isObjectLiteralExpression(initializer)) {
                return initializer;
            }

            // console.log({
            //     getIdentifierReferenceValue: true,
            //     def: def?.getText(),
            //     identifier: identifier.getText(),
            //     kind: def?.getKindName(),
            //     type: def?.getType().getText(),
            //     initializer: initializer?.getText(),
            //     initializerKind: initializer?.getKindName(),
            // });
        }
    }
};

const tryUnwrapBinaryExpression = (node: BinaryExpression) => {
    if (node.getOperatorToken().getKind() !== ts.SyntaxKind.PlusToken) return;

    const left = unwrapExpression(node.getLeft());
    const right = unwrapExpression(node.getRight());

    const leftValue = maybeStringLiteral(left);
    const rightValue = maybeStringLiteral(right);

    // console.log({
    //     leftValue,
    //     rightValue,
    //     left: [left.getKindName(), left.getText()],
    //     right: [right.getKindName(), right.getText()],
    // });

    if (isNotNullish(leftValue) && isNotNullish(rightValue)) {
        return leftValue + rightValue;
    }
};

const getElementAccessedExpressionValue = (
    expression: ElementAccessExpression
): string | string[] | ObjectLiteralExpression | undefined => {
    const type = expression.getType();
    if (type.isLiteral() || type.isUnionOrIntersection()) return parseType(type);

    const elementAccessed = unwrapExpression(expression.getExpression());
    const arg = unwrapExpression(expression.getArgumentExpressionOrThrow());

    const argValue = maybeStringLiteral(arg);

    // console.log("yes", {
    //     arg: arg.getText(),
    //     argKind: arg.getKindName(),
    //     elementAccessed: elementAccessed.getText(),
    //     elementAccessedKind: elementAccessed.getKindName(),
    //     expression: expression.getText(),
    //     expressionKind: expression.getKindName(),
    //     argValue,
    // });

    // <ColorBox color={xxx["yyy"]} />
    if (Node.isIdentifier(elementAccessed) && isNotNullish(argValue)) {
        return maybePropIdentifierDefinitionValue(elementAccessed, argValue);
    }

    // <ColorBox color={xxx[yyy + "zzz"]} />
    if (Node.isBinaryExpression(arg)) {
        const propName = tryUnwrapBinaryExpression(arg) ?? maybeStringLiteral(arg);

        if (isNotNullish(propName) && Node.isIdentifier(elementAccessed)) {
            return maybePropIdentifierDefinitionValue(elementAccessed, propName);
        }
    }

    // <ColorBox color={xxx[`yyy`]} />
    if (Node.isTemplateExpression(arg)) {
        const propName = maybeTemplateStringValue(arg);

        if (isNotNullish(propName) && Node.isIdentifier(elementAccessed)) {
            return maybePropIdentifierDefinitionValue(elementAccessed, propName);
        }
    }

    // <ColorBox color={{ staticColor: "facebook.900" }["staticColor"]}></ColorBox>
    if (Node.isObjectLiteralExpression(elementAccessed) && isNotNullish(argValue)) {
        return getPropValue(elementAccessed, argValue);
    }

    // <ColorBox color={xxx[yyy.zzz]} />
    if (Node.isPropertyAccessExpression(arg)) {
        return getPropertyAccessedExpressionValue(arg);
    }

    // <ColorBox color={xxx[yyy[zzz]]} />
    if (Node.isIdentifier(elementAccessed) && Node.isElementAccessExpression(arg)) {
        const propName = getElementAccessedExpressionValue(arg);

        if (typeof propName === "string" && isNotNullish(propName)) {
            return maybePropIdentifierDefinitionValue(elementAccessed, propName);
        }
    }

    // <ColorBox color={xxx[yyy[zzz]]} />
    if (Node.isElementAccessExpression(elementAccessed) && isNotNullish(argValue)) {
        const identifier = getElementAccessedExpressionValue(elementAccessed);
        if (Node.isNode(identifier) && Node.isObjectLiteralExpression(identifier)) {
            return getPropValue(identifier, argValue);
        }
    }

    // <ColorBox color={xxx[[yyy][zzz]]} />
    if (Node.isArrayLiteralExpression(elementAccessed) && isNotNullish(argValue)) {
        return getArrayElementValueAtIndex(elementAccessed, Number(argValue));
    }

    // <ColorBox color={xxx[aaa ? yyy : zzz]]} />
    if (Node.isConditionalExpression(arg)) {
        const propName = maybeStringLiteral(arg);
        // eslint-disable-next-line sonarjs/no-collapsible-if
        if (isNotNullish(propName)) {
            // eslint-disable-next-line unicorn/no-lonely-if
            if (Node.isIdentifier(elementAccessed)) {
                return maybePropIdentifierDefinitionValue(elementAccessed, propName);
            }
        }

        const whenTrue = unwrapExpression(arg.getWhenTrue());
        const whenFalse = unwrapExpression(arg.getWhenFalse());

        const whenTrueValue = maybeStringLiteral(whenTrue);
        const whenFalseValue = maybeStringLiteral(whenFalse);

        // console.log({
        //     whenTrueValue,
        //     whenFalseValue,
        //     whenTrue: [whenTrue.getKindName(), whenTrue.getText()],
        //     whenFalse: [whenFalse.getKindName(), whenFalse.getText()],
        // });

        if (Node.isIdentifier(elementAccessed)) {
            const whenTrueResolved = isNotNullish(whenTrueValue)
                ? maybePropIdentifierDefinitionValue(elementAccessed, whenTrueValue)
                : undefined;
            const whenFalseResolved = isNotNullish(whenFalseValue)
                ? maybePropIdentifierDefinitionValue(elementAccessed, whenFalseValue)
                : undefined;

            if (isNotNullish(whenTrueResolved) && isNotNullish(whenFalseResolved)) {
                return [whenTrueResolved, whenFalseResolved].flat();
            }
        }
    }
};

const getArrayElementValueAtIndex = (array: ArrayLiteralExpression, index: number) => {
    const element = array.getElements()[index];
    if (!element) return;

    const value = maybeLiteral(element);
    // console.log({
    //     array: array.getText(),
    //     arrayKind: array.getKindName(),
    //     element: element.getText(),
    //     elementKind: element.getKindName(),
    //     value,
    // });

    if (isNotNullish(value)) {
        return value;
    }

    if (Node.isObjectLiteralExpression(element)) {
        return element;
    }
};

const getPropertyAccessedExpressionValue = (expression: PropertyAccessExpression) => {
    const type = expression.getType();
    if (type.isLiteral() || type.isUnionOrIntersection()) return parseType(type);

    const maybeValue = safeEvaluateNode<string | string[]>(expression);
    if (isNotNullish(maybeValue)) return maybeValue;

    const propName = expression.getName();
    const elementAccessed = unwrapExpression(expression.getExpression());

    if (Node.isIdentifier(elementAccessed)) {
        return maybePropIdentifierDefinitionValue(elementAccessed, propName);
    }
};

// https://gist.github.com/dsherret/826fe77613be22676778b8c4ba7390e7
function query<T extends Node = Node>(node: Node, q: string): T[] {
    return tsquery(node.compilerNode as any, q).map((n) => (node as any)._getNodeFromCompilerNode(n) as T);
}

function queryOne<T extends Node = Node>(node: Node, q: string): T | undefined {
    const results = query<T>(node, q);
    return results.length > 0 ? results[0] : undefined;
}

const EvalError = Symbol("EvalError");
/**
 * Evaluates with strict policies restrictions
 * @see https://github.com/wessberg/ts-evaluator#setting-up-policies
 */
const evaluateExpression = (node: Expression, morphTypeChecker: TypeChecker) => {
    const compilerNode = node.compilerNode;
    const typeChecker = morphTypeChecker.compilerObject;

    const result = evaluate({
        node: compilerNode as any,
        typeChecker: typeChecker as any,
        typescript: ts as any,
        policy: {
            deterministic: true,
            network: false,
            console: false,
            maxOps: 100,
            maxOpDuration: 1000,
            io: { read: false, write: false },
            process: { exit: false, spawnChild: false },
        },
    });

    // console.log({
    //     compilerNode: compilerNode.getText(),
    //     compilerNodeKind: node.getKindName(),
    //     result: result.success ? result.value : null,
    // });
    return result.success ? result.value : EvalError;
};

const safeEvaluateNode = <T>(node: Expression) => {
    const result = evaluateExpression(node, node.getProject().getTypeChecker());
    if (result === EvalError) return;
    return result as T;
};

const evaluateNode = <T>(node: Expression) => evaluateExpression(node, node.getProject().getTypeChecker()) as T;
