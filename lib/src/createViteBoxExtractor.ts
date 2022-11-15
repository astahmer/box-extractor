import { isAbsolute, resolve } from "node:path";

import type { SourceFile } from "ts-morph";
import { Project, ts } from "ts-morph";
import type { Plugin } from "vite";
import { extract } from "./extract";

// https://github.com/qmhc/vite-plugin-dts/blob/main/src/plugin.ts
const tsConfigFilePath = "tsconfig.json";
const tsRE = /\.tsx?$/;
const ensureAbsolute = (path: string, root: string) => (path ? (isAbsolute(path) ? path : resolve(root, path)) : root);

// JsxElement:has(Identifier[name="ColorBox"]) JsxAttribute > Identifier[name=/color|backgroundColor/] ~ StringLiteral

// JsxOpeningElement:has(Identifier[name="ColorBox"]) JsxAttribute
// JsxOpeningElement:has(Identifier[name="ColorBox"]) JsxSpreadAttribute
// for ConditionalExpression, we only need the node after QuestionToken
// JsxOpeningElement / JsxSelfClosingElement
//   -> JsxAttribute
//       -> StringLiteral
//       -> JsxExpression
//          -> children.length === 1 && children[0] === Identifier
//          -> ? Identifier[name=color] (if name is ok) StringLiteral
//          -> :
//          -> ConditionalExpression
//              -> StringLiteral
//              -> Identifier
//          -> PropertyAccessExpression :last-child
//          -> ElementAccessExpression :last-child
//   -> JsxSpreadAttribute
//      -> PropertyAssignment > Identifier[name=color]
//          -> StringLiteral
//      -> PropertyAssignment > ComputedPropertyName > Identifier[name=var] (if var is ok) StringLiteral
//      -> & > ConditionalExpression
//      -> & > Identifier

export const createViteBoxExtractor = (): Plugin => {
    let project: Project;

    return {
        enforce: "pre",
        name: "vite-box-extractor",
        configResolved(config) {
            const root = ensureAbsolute("", config.root);
            const tsConfigPath = ensureAbsolute(tsConfigFilePath, root);
            project = new Project({
                compilerOptions: {
                    jsx: ts.JsxEmit.React,
                    jsxFactory: "React.createElement",
                    jsxFragmentFactory: "React.Fragment",
                    module: ts.ModuleKind.ESNext,
                    target: ts.ScriptTarget.ESNext,
                    noUnusedParameters: false,
                    declaration: false,
                    noEmit: true,
                    emitDeclarationOnly: false,
                    // allowJs: true,
                    // useVirtualFileSystem: true,
                },
                tsConfigFilePath: tsConfigPath,
                skipAddingFilesFromTsConfig: true,
            });
        },

        transform(code, id) {
            let sourceFile: SourceFile;

            // add ts file to project so that references can be resolved
            if (tsRE.test(id)) {
                sourceFile = project.addSourceFileAtPath(id);
            }

            if (id.endsWith(".tsx")) {
                extract(sourceFile!, {
                    componentName: "ColorBox",
                    propNameList: ["color", "backgroundColor"],
                });
            }

            return null;
        },
    };
};
