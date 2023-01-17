import Editor from "@monaco-editor/react";
import { useActor } from "@xstate/react";
import { Box } from "../theme/Box";
import { Flex } from "../theme/components";
import { usePlaygroundContext } from "./Playground.machine";

// https://microsoft.github.io/monaco-editor/playground.html#extending-language-services-hover-provider-example

export const Playground = () => {
    return (
        <Flex h="100%" pos="relative">
            <Box display="flex" boxSize="100%">
                {/* <SplitPane defaultSize="50%" onResize={(ctx) => send({ type: "Resize", context: ctx })}> */}
                <Box h="100%" flexGrow={1} flexShrink={0}>
                    <Editor
                    // path={activeInputTab}
                    // value={inputList.at(activeInputIndex)?.content}
                    // onChange={(content) => send({ type: "Update input", value: content ?? "" })}
                    // onMount={(editor, monaco) => {
                    //     send({ type: "Editor Loaded", editor, name: "input" });
                    //     editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                    //         send({ type: "Save" });
                    //     });
                    // }}
                    // theme={colorMode === "dark" ? "vs-dark" : "vs-light"}
                    />
                </Box>
                <Box h="100%" flexGrow={1} flexShrink={0} minW={0}>
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
                {/* </SplitPane> */}
            </Box>
        </Flex>
    );
};
