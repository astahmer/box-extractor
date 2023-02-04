import Editor from "@monaco-editor/react";
import { useActor } from "@xstate/react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { match } from "ts-pattern";
import { useColorMode } from "../ColorModeToggle/ColorModeToggle";
import { box, Box } from "../theme/Box";
import { css } from "../theme/theme";
import { ExtractedTreeBasic, ExtractedTreeComfy, ExtractedTreeMinimal } from "./ExtractedTree";
import { usePlaygroundContext } from "./Playground.machine";
import { ResizeHandle } from "./ResizeHandle";
import { TagsInput } from "./TagsInput";

export const Playground = () => {
    const service = usePlaygroundContext();
    const [state, send] = useActor(service);
    console.log(state.value, state.context);

    const { colorMode } = useColorMode();

    return (
        <Box display="flex" h="100%" pos="relative">
            <Box display="flex" boxSize="100%">
                <PanelGroup direction="horizontal">
                    <Panel className={css({ display: "flex", flexDirection: "column" })} minSize={20}>
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
                    <Panel className={css({ display: "flex", flexDirection: "column" })} minSize={20}>
                        <Box boxSize="100%" display="flex" flexDirection="column" overflow="hidden" padding="4">
                            <Box mb="4" display="flex">
                                <div>
                                    <TagsInput
                                        value={["Box"]}
                                        placeholder="Add components"
                                        onChange={(details) => {
                                            send({ type: "Update components", list: details.values });
                                        }}
                                    />
                                    <TagsInput
                                        placeholder="Add functions"
                                        onChange={(details) => {
                                            send({ type: "Update functions", list: details.values });
                                        }}
                                    />
                                </div>
                                <box.input
                                    ml="6"
                                    alignSelf="flex-end"
                                    type="search"
                                    placeholder="Search"
                                    onChange={(e) => send({ type: "Update search filter", search: e.target.value })}
                                />
                                <Box ml="auto" display="flex" flexDirection="row" mt="4" alignItems="center">
                                    <Box color="white" mr="4">
                                        Select view mode
                                    </Box>
                                    <select
                                        onChange={(e) => {
                                            console.log(e.target.value, state.context.viewMode);
                                            send({ type: "Select mode", viewMode: e.target.value as any });
                                        }}
                                    >
                                        <option value="basic">Basic</option>
                                        <option value="minimal">Minimal</option>
                                        <option value="comfy">Comfy</option>
                                    </select>
                                </Box>
                            </Box>
                            {/* TODO search input filter (name / propName) + type filter (select node.type) */}
                            {state.context.extracted
                                ? match(state.context.viewMode)
                                      .with("basic", () => <ExtractedTreeBasic extracted={state.context.extracted!} />)
                                      .with("minimal", () => (
                                          <ExtractedTreeMinimal extracted={state.context.extracted!} />
                                      ))
                                      .with("comfy", () => <ExtractedTreeComfy extracted={state.context.extracted!} />)
                                      .exhaustive()
                                : null}
                        </Box>
                    </Panel>
                </PanelGroup>
            </Box>
        </Box>
    );
};
