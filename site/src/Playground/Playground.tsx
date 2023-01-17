import Editor from "@monaco-editor/react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { Box } from "../theme/Box";
import { Flex } from "../theme/components";
import { themeSprinkles } from "../theme/css";
import { ResizeHandle } from "./ResizeHandle";

export const Playground = () => {
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
