import { extract } from "@box-extractor/core";
import Editor from "@monaco-editor/react";
import { useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { useColorMode } from "../ColorModeToggle/ColorModeToggle";
import { Box } from "../theme/Box";
import { Flex } from "../theme/components";
import { themeSprinkles } from "../theme/css";
import { ResizeHandle } from "./ResizeHandle";

import { Project, SourceFile, ts } from "ts-morph";

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
        // tsConfigFilePath: tsConfigPath,
        skipAddingFilesFromTsConfig: true,
        skipFileDependencyResolution: true,
        skipLoadingLibFiles: true,
        useInMemoryFileSystem: true,
    });
};

const project: Project = createProject();

export const Playground = () => {
    const [input, setInput] = useState("");
    const { colorMode } = useColorMode();

    console.log({ input, colorMode });

    return (
        <Flex h="100%" pos="relative">
            <Box display="flex" boxSize="100%">
                <PanelGroup direction="horizontal">
                    <Panel className={themeSprinkles({ display: "flex", flexDirection: "column" })} minSize={20}>
                        <Box
                            boxSize="100%"
                            display="flex"
                            flexDirection="row"
                            alignItems="center"
                            justifyContent="center"
                            overflow="hidden"
                        >
                            <Editor
                                onChange={(value) => {
                                    if (!value) return;
                                    // setInput(value ?? "");
                                    const sourceFile = project.createSourceFile("file.ts", value, {
                                        scriptKind: ts.ScriptKind.TSX,
                                        overwrite: true,
                                    });
                                    const extractMap = new Map();
                                    const result = extract({ ast: sourceFile, extractMap, components: ["Box"] });
                                    console.log({ value, result, extractMap });
                                }}
                                language="typescript"
                                // onChange={(content) => send({ type: "Update input", value: content ?? "" })}
                                // onMount={(editor, monaco) => {
                                //     send({ type: "Editor Loaded", editor, name: "input" });
                                //     editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                                //         send({ type: "Save" });
                                //     });
                                // }}
                                theme={colorMode === "dark" ? "vs-dark" : "vs-light"}
                            />
                        </Box>
                    </Panel>
                    <ResizeHandle />
                    <Panel className={themeSprinkles({ display: "flex", flexDirection: "column" })} minSize={20}>
                        <Box
                            boxSize="100%"
                            // bg="blue.800"
                            display="flex"
                            flexDirection="row"
                            alignItems="center"
                            justifyContent="center"
                            overflow="hidden"
                        >
                            <Editor
                            // path={activeOutputTab}
                            // value={outputList.at(state.context.activeOutputIndex)?.content}
                            // // theme={colorMode === "dark" ? "vs-dark" : "vs-light"}
                            // beforeMount={(monaco) => {
                            //     const declarations: Array<{ name: string; code: string }> = import.meta.compileTime(
                            //         "../macros/get-ts-declarations.ts"
                            //     );

                            //     declarations.forEach(({ name, code }) => {
                            //         monaco.languages.typescript.typescriptDefaults.addExtraLib(code, name);
                            //     });
                            // }}
                            // onMount={(editor, monaco) =>
                            //     send({ type: "Editor Loaded", editor, name: "output", monaco })
                            // }
                            />
                        </Box>
                    </Panel>
                </PanelGroup>
            </Box>
        </Flex>
    );
};
