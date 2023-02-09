import { extract } from "@box-extractor/core";
import MagicString from "magic-string";
import { Node, Project, SourceFile, ts } from "ts-morph";
import { bench, describe } from "vitest";

const createProject = () => {
    return new Project({
        compilerOptions: {
            jsx: ts.JsxEmit.React,
            jsxFactory: "React.createElement",
            jsxFragmentFactory: "React.Fragment",
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ESNext,
            noUnusedParameters: false,
            declaration: false,
            noEmit: true,
            emitDeclaratio: false,
            // allowJs: true,
            // useVirtualFileSystem: true,
        },
        skipAddingFilesFromTsConfig: true,
        skipFileDependencyResolution: true,
        skipLoadingLibFiles: true,
    });
};

const project: Project = createProject();

let sourceFile: SourceFile;

describe("ts-morph remove/replaceWihtText vs magic-string update", () => {
    sourceFile = project.addSourceFileAtPath("./tests/samples/ExtractedTree.tsx");
    const sourceCode = sourceFile.getFullText();
    let fileCount = 0;

    // cheap afterEach() replacement
    const resetSourceFile = () => {
        if (!sourceFile) return;

        if (sourceFile.wasForgotten()) return;
        fileCount++;
        project.removeSourceFile(sourceFile);
        sourceFile = project.createSourceFile(`test-${fileCount}.tsx`, sourceCode, { scriptKind: ts.ScriptKind.TSX });
    };

    const charactersAfterManipulation = {
        replaceWithText: 0,
        remove: 0,
        magicString: 0,
    };
    const counts = {
        replaceWithText: 0,
        remove: 0,
        magicString: 0,
    };

    bench("ts-morph replaceWithText", () => {
        resetSourceFile();

        const extracted = extract({ ast: sourceFile, components: ["Box", "Stack"] });
        let count = 0;

        extracted.forEach((map) => {
            map.queryList.forEach((query) => {
                if (query.box.isMap()) {
                    query.box.value.forEach((nodeList) => {
                        const boxNode = nodeList[0]!;
                        const jsxAttribute = boxNode.getStack()[0];
                        if (Node.isJsxAttribute(jsxAttribute)) {
                            count++;
                            jsxAttribute.replaceWithText("");
                        }
                    });
                }
            });
        });

        // cheap expect() test
        if (charactersAfterManipulation.replaceWithText === 0) {
            charactersAfterManipulation.replaceWithText = sourceFile.getFullText().length;
        }

        if (counts.replaceWithText === 0) {
            counts.replaceWithText = count;
        }

        // console.log({ replaceWithText: count });
    });

    bench("ts-morph remove", () => {
        resetSourceFile();

        const extracted = extract({ ast: sourceFile, components: ["Box", "Stack"] });
        let count = 0;

        extracted.forEach((map) => {
            map.queryList.forEach((query) => {
                if (query.box.isMap()) {
                    query.box.value.forEach((nodeList) => {
                        const boxNode = nodeList[0]!;
                        const jsxAttribute = boxNode.getStack()[0];
                        if (Node.isJsxAttribute(jsxAttribute)) {
                            count++;
                            jsxAttribute.remove();
                        }
                    });
                }
            });
        });

        // cheap expect() test

        if (charactersAfterManipulation.remove === 0) {
            charactersAfterManipulation.remove = sourceFile.getFullText().length;
            if (charactersAfterManipulation.remove !== charactersAfterManipulation.replaceWithText) {
                throw new Error("charactersAfterManipulation.remove !== charactersAfterManipulation.replaceWithText");
            }
        }

        if (counts.remove === 0) {
            counts.remove = count;

            if (counts.remove !== counts.replaceWithText) {
                throw new Error("counts.remove !== counts.replaceWithText");
            }
        }

        // console.log({ remove: count });
    });

    bench("magic-string update", () => {
        resetSourceFile();

        const extracted = extract({ ast: sourceFile, components: ["Box", "Stack"] });
        let count = 0;

        const original = sourceFile.getFullText();
        const s = new MagicString(original);

        extracted.forEach((map) => {
            map.queryList.forEach((query) => {
                if (query.box.isMap()) {
                    query.box.value.forEach((nodeList) => {
                        const boxNode = nodeList[0]!;
                        const jsxAttribute = boxNode.getStack()[0];
                        if (Node.isJsxAttribute(jsxAttribute)) {
                            count++;
                            s.update(jsxAttribute.getPos(), jsxAttribute.getEnd(), "");
                        }
                    });
                }
            });
        });

        // cheap expect() test

        if (charactersAfterManipulation.magicString === 0) {
            charactersAfterManipulation.magicString = s.toString().length;
            if (charactersAfterManipulation.magicString !== charactersAfterManipulation.replaceWithText) {
                throw new Error(
                    "charactersAfterManipulation.magicString !== charactersAfterManipulation.replaceWithText"
                );
            }
        }

        if (counts.magicString === 0) {
            counts.magicString = count;

            if (counts.magicString !== counts.replaceWithText) {
                throw new Error("counts.magicString !== counts.replaceWithText");
            }
        }

        // console.log({ update: count });
    });
});
