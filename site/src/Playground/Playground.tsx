import Editor from "@monaco-editor/react";
import { useActor } from "@xstate/react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { useColorMode } from "../ColorModeToggle/ColorModeToggle";
import { Box } from "../theme/Box";
import { Flex, Stack } from "../theme/components";
import { themeSprinkles } from "../theme/css";
import { Switch } from "../theme/Switch";
import { ExtractedTreeCompact, ExtractedTree } from "./ExtractedTree";
import { usePlaygroundContext } from "./Playground.machine";
import { ResizeHandle } from "./ResizeHandle";
import { TagsInput } from "./TagsInput";

export const Playground = () => {
    const service = usePlaygroundContext();
    const [state, send] = useActor(service);
    console.log(state.value, state.context);

    const { colorMode } = useColorMode();

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
                                language="typescript"
                                onChange={(content) => send({ type: "Update input", value: content ?? "" })}
                                keepCurrentModel
                                path="Playground.tsx"
                                onMount={(editor, monaco) => {
                                    const tsDefaults = monaco.languages.typescript.typescriptDefaults;
                                    // tsDefaults.setDiagnosticsOptions({
                                    //     // noSyntaxValidation: true,
                                    //     // noSemanticValidation: true,
                                    // });
                                    tsDefaults.setCompilerOptions({
                                        jsx: monaco.languages.typescript.JsxEmit.React,
                                        // jsxFactory: "React.createElement",
                                        // target: monaco.languages.typescript.ScriptTarget.ESNext,
                                        // allowNonTsExtensions: true,
                                        // moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                                        // module: monaco.languages.typescript.ModuleKind.ESNext,
                                        // allowJs: true,
                                    });

                                    console.log("editor mounted", editor, monaco);
                                    send({ type: "Editor Loaded", editor, monaco });
                                    // editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                                    //     send({ type: "Save" });
                                    // });
                                }}
                                theme={colorMode === "dark" ? "vs-dark" : "vs-light"}
                            />
                        </Box>
                    </Panel>
                    <ResizeHandle />
                    <Panel className={themeSprinkles({ display: "flex", flexDirection: "column" })} minSize={20}>
                        <Box boxSize="100%" display="flex" flexDirection="column" overflow="hidden" padding="4">
                            <Box mb="4" display="flex">
                                <TagsInput
                                    placeholder="Add components"
                                    onChange={(details) => {
                                        send({ type: "Update components", list: details.values });
                                    }}
                                />
                                <Box ml="auto" display="flex" flexDirection="row" mt="4" alignItems="center">
                                    <Box color="white" mr="4">
                                        Toggle literal mode
                                    </Box>
                                    <Switch
                                        onChange={() => {
                                            send({ type: "Toggle literal mode" });
                                        }}
                                    />
                                </Box>
                            </Box>
                            {/* TODO search input filter (name / propName) + type filter (select node.type) */}
                            {state.context.extracted ? (
                                state.context.isLiteralMode ? (
                                    <ExtractedTreeCompact extracted={state.context.extracted} />
                                ) : (
                                    <ExtractedTree extracted={state.context.extracted} />
                                )
                            ) : null}
                        </Box>
                    </Panel>
                </PanelGroup>
            </Box>
        </Flex>
    );
};
