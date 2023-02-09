import { getAncestorComponent, getNameLiteral, query, unquote } from "@box-extractor/core";
import { createLogger } from "@box-extractor/logger";
import { Identifier, Node, SourceFile, ts, TypeAliasDeclaration } from "ts-morph";

const logger = createLogger("box-ex:vanilla-wind:create-theme");

export const findTypeReferenceUsage = (sourceFile: SourceFile, typeReferenceName: string) => {
    const identifierList = query<Identifier>(
        sourceFile,
        `TypeReference:has(Identifier[name="${typeReferenceName}"]) > TypeQuery > Identifier`
    );
    const foundComponentsWithTheirThemeName = new Map<string, string>();
    const visiteds = new WeakSet<Node>();

    identifierList.forEach((identifier) => {
        if (visiteds.has(identifier)) return;
        visiteds.add(identifier);

        const component = getAncestorComponent(identifier);
        // console.log({ identifier: identifier.getText(), component: component?.getText() });

        if (component) {
            const [themeNameStr, componentNameStr] = [getNameLiteral(identifier, []), getNameLiteral(component, [])];
            if (!themeNameStr || !componentNameStr) return null;

            const themeName = unquote(themeNameStr);
            const componentName = unquote(componentNameStr);

            logger({ themeName, componentName });
            // console.log({ themeName, componentName });
            foundComponentsWithTheirThemeName.set(componentName, themeName);
            return;
        }

        logger(`no direct ancestor component found for ${typeReferenceName}, checking references`);

        const typeReference = identifier.getFirstAncestorByKind(ts.SyntaxKind.TypeAliasDeclaration);
        // console.log({ typeReference: typeReference?.getText(), typeReferenceKind: typeReference?.getKindName() });
        if (!typeReference) return;

        const processTypeAliasDeclaration = (localDeclaration: TypeAliasDeclaration) => {
            const typeReferenceIdentifier = localDeclaration.getNameNode();
            const references = typeReferenceIdentifier.findReferencesAsNodes();
            if (references.length === 0) {
                logger("no references found for", typeReferenceIdentifier.getText());
                return null;
            }

            while (references.length > 0) {
                const reference = references.shift()!;
                if (visiteds.has(reference)) continue;
                visiteds.add(reference);

                // console.log({ reference: reference.getText() });
                const parent = reference.getParent();
                if (!parent) continue;
                if (visiteds.has(parent)) continue;
                visiteds.add(parent);

                if (Node.isImportSpecifier(parent)) continue;

                // console.log({ parent: parent?.getText(), parentKind: parent?.getKindName() });
                const declaration = parent.getFirstAncestor((node) => {
                    // console.log({ node: node.getText(), nodeKind: node.getKindName() });
                    return (
                        Node.isVariableDeclaration(node) ||
                        (Node.isFunctionDeclaration(node) && Boolean(node.getNameNode())) ||
                        Node.isTypeAliasDeclaration(node)
                    );
                });
                if (!declaration || visiteds.has(declaration)) continue;
                visiteds.add(declaration);
                // console.log({ node: declaration.getText(), nodeKind: declaration.getKindName() });

                if (Node.isTypeAliasDeclaration(declaration)) {
                    processTypeAliasDeclaration(declaration);
                    continue;
                }

                if (Node.isVariableDeclaration(declaration) || Node.isFunctionDeclaration(declaration)) {
                    const nameNode = declaration.getNameNode();
                    if (!nameNode) continue;

                    const componentNameStr = getNameLiteral(nameNode, []);
                    if (!componentNameStr) continue;

                    // foundComponentNameList.add(unquote(name));
                    const themeNameStr = getNameLiteral(identifier, []);
                    if (!themeNameStr) continue;

                    const themeName = unquote(themeNameStr);
                    const componentName = unquote(componentNameStr);

                    logger({ themeName, componentName });
                    // console.log({ themeName, componentName });
                    foundComponentsWithTheirThemeName.set(componentName, themeName);
                }
            }
        };

        processTypeAliasDeclaration(typeReference);
    });

    return foundComponentsWithTheirThemeName;
};
