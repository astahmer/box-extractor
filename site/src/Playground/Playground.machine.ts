import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { createContextWithHook } from "pastable/react";
import type { InterpreterFrom } from "xstate";
import { assign, createMachine } from "xstate";
import { Identifier, Node, Project, SourceFile, ts } from "ts-morph";
import { BoxNode, BoxNodesMap, extract } from "@box-extractor/core";
import { tsquery } from "@phenomnomnominal/tsquery";

type PlaygroundContext = {
    monaco: Monaco | null;
    inputEditor: editor.IStandaloneCodeEditor | null;
    sourceFile: SourceFile | null;
    extracted: BoxNodesMap | null;
    components: string[];
    functions: string[];
    isLiteralMode: boolean;
    selectedNode: BoxNode | null;
    selectedIdentifier: string | null;
    selectedProp: string | null;
    decorations: string[];
};

type PlaygroundEvent =
    | { type: "Editor Loaded"; editor: editor.IStandaloneCodeEditor; monaco: Monaco }
    | { type: "Update input"; value: string }
    | { type: "Update components"; list: string[] }
    | { type: "Update functions"; list: string[] }
    | { type: "Toggle literal mode" }
    | { type: "Select identifier"; identifier: string }
    | { type: "Select prop"; identifier: string; prop: string }
    | { type: "Select node"; identifier: string; prop: string; node: BoxNode };

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

const initialContext: PlaygroundContext = {
    monaco: null,
    inputEditor: null,
    sourceFile: null,
    extracted: null,
    components: ["Box"],
    functions: [],
    isLiteralMode: false,
    selectedIdentifier: null,
    selectedProp: null,
    selectedNode: null,
    decorations: [],
};

export const playgroundMachine = createMachine(
    {
        predictableActionArguments: true,
        id: "playground",
        tsTypes: {} as import("./Playground.machine.typegen").Typegen0,
        schema: {
            context: {} as PlaygroundContext,
            events: {} as PlaygroundEvent,
        },
        context: initialContext,
        initial: "loading",
        states: {
            loading: {
                on: { "Editor Loaded": { target: "ready", actions: "assignEditorRef" } },
            },
            ready: {
                initial: "Playing",
                states: {
                    Playing: {
                        on: {
                            "Update input": { actions: ["updateOutput"] },
                            "Update components": { actions: ["updateComponents", "updateOutput"] },
                            "Update functions": { actions: ["updateFunctions", "updateOutput"] },
                            "Toggle literal mode": { actions: ["toggleLiteralMode"] },
                            "Select identifier": { actions: ["selectIdentifier", "updateHighlight"] },
                            "Select prop": { actions: ["selectProp", "updateHighlight"] },
                            "Select node": { actions: ["selectNode", "updateHighlight"] },
                        },
                    },
                },
            },
        },
    },
    {
        actions: {
            assignEditorRef: assign((ctx, event) => {
                return { ...ctx, inputEditor: event.editor, monaco: event.monaco };
            }),
            updateOutput: assign((ctx, event) => {
                const value = event.type === "Update input" ? event.value : ctx.inputEditor?.getValue() ?? "";
                const sourceFile = project.createSourceFile("file.ts", value, {
                    scriptKind: ts.ScriptKind.TSX,
                    overwrite: true,
                });
                const result = extract({
                    ast: sourceFile,
                    extractMap: new Map(),
                    components: ctx.components,
                    functions: ctx.functions,
                });
                // console.log({ value });
                console.log(result);

                return { ...ctx, sourceFile, extracted: result };
            }),
            updateComponents: assign((ctx, event) => {
                return { ...ctx, components: event.list };
            }),
            updateFunctions: assign((ctx, event) => {
                return { ...ctx, functions: event.list };
            }),
            toggleLiteralMode: assign((ctx, _event) => {
                return { ...ctx, isLiteralMode: !ctx.isLiteralMode };
            }),
            selectIdentifier: assign((ctx, event) => {
                return { ...ctx, selectedIdentifier: event.identifier };
            }),
            selectProp: assign((ctx, event) => {
                return { ...ctx, selectedIdentifier: event.identifier, selectedProp: event.prop };
            }),
            selectNode: assign((ctx, event) => {
                return {
                    ...ctx,
                    selectedIdentifier: event.identifier,
                    selectedProp: event.prop,
                    selectedNode: event.node,
                };
            }),
            updateHighlight: assign((ctx, event) => {
                console.log("updateHighlight", event);
                if (!ctx.sourceFile || !ctx.monaco || !ctx.inputEditor) return ctx;

                if (event.type === "Select node") {
                    const node = event.node.getNode();

                    const range = getRange(ctx.sourceFile, node);
                    const decoration: editor.IModelDeltaDecoration = {
                        range: new ctx.monaco.Range(
                            range.startLineNumber,
                            range.startColumn,
                            range.endLineNumber,
                            range.endColumn
                        ),
                        options: { className: "editorRangeHighlight" },
                    };

                    const updated = ctx.inputEditor?.deltaDecorations(ctx.decorations, [decoration]);

                    try {
                        ctx.inputEditor.revealRangeInCenterIfOutsideViewport(range);
                    } catch {
                        // ignore, for some reason this was throwing
                    }

                    return { ...ctx, decorations: updated };
                }

                if (event.type === "Select prop") {
                    const componentName = event.identifier;
                    const identifierSelector = componentName.includes(".")
                        ? `PropertyAccessExpression:has(Identifier[name="${componentName.split(".")[0]}"])`
                        : `Identifier[name="${componentName}"]`;
                    const componentSelector = `:matches(JsxOpeningElement, JsxSelfClosingElement):has(${identifierSelector})`;

                    const namedProp = `[name="${event.prop}"]`;
                    const propIdentifier = `Identifier${namedProp}`;
                    const propSelector = `${componentSelector} JsxAttribute > ${propIdentifier}`;
                    const identifierNodesFromJsxAttribute = query<Identifier>(ctx.sourceFile, propSelector) ?? [];

                    if (identifierNodesFromJsxAttribute.length === 0) return ctx;

                    const decorations: editor.IModelDeltaDecoration[] = identifierNodesFromJsxAttribute.map((node) => {
                        const range = getRange(ctx.sourceFile!, node);
                        return {
                            range: new ctx.monaco!.Range(
                                range.startLineNumber,
                                range.startColumn,
                                range.endLineNumber,
                                range.endColumn
                            ),
                            options: { className: "editorRangeHighlight" },
                        };
                    });
                    const updated = ctx.inputEditor?.deltaDecorations(ctx.decorations, decorations);

                    try {
                        const first = decorations[0];
                        ctx.inputEditor.revealRangeInCenterIfOutsideViewport(first!.range);
                    } catch {
                        // ignore, for some reason this was throwing
                    }

                    return { ...ctx, decorations: updated };
                }

                if (event.type === "Select identifier") {
                    const componentName = event.identifier;
                    const identifierSelector = componentName.includes(".")
                        ? `PropertyAccessExpression:has(Identifier[name="${componentName.split(".")[0]}"])`
                        : `Identifier[name="${componentName}"]`;
                    const componentSelector = `:matches(JsxOpeningElement, JsxSelfClosingElement):has(${identifierSelector})`;
                    const identifierNodes = query<Identifier>(ctx.sourceFile, componentSelector) ?? [];
                    console.log(identifierNodes);

                    if (identifierNodes.length === 0) return ctx;

                    const decorations: editor.IModelDeltaDecoration[] = identifierNodes.map((node) => {
                        const range = getRange(ctx.sourceFile!, node);
                        return {
                            range: new ctx.monaco!.Range(
                                range.startLineNumber,
                                range.startColumn,
                                range.endLineNumber,
                                range.endColumn
                            ),
                            options: { className: "editorRangeHighlight" },
                        };
                    });
                    const updated = ctx.inputEditor?.deltaDecorations(ctx.decorations, decorations);

                    try {
                        const first = decorations[0];
                        ctx.inputEditor.revealRangeInCenterIfOutsideViewport(first!.range);
                    } catch {
                        // ignore, for some reason this was throwing
                    }

                    return { ...ctx, decorations: updated };
                }

                return ctx;
            }),
        },
    }
);

export const [PlaygroundMachineProvider, usePlaygroundContext] =
    createContextWithHook<InterpreterFrom<typeof playgroundMachine>>("PlaygroundMachineContext");

// https://gist.github.com/dsherret/826fe77613be22676778b8c4ba7390e7
function query<T extends Node = Node>(node: Node, q: string): T[] {
    return tsquery(node.compilerNode as any, q).map((n) => (node as any)._getNodeFromCompilerNode(n) as T);
}

const getRange = (src: SourceFile, node: Node) => {
    const startInfo = src.getLineAndColumnAtPos(node.getStart());
    const endInfo = src.getLineAndColumnAtPos(node.getEnd());

    return {
        startLineNumber: startInfo.line,
        startColumn: startInfo.column,
        endLineNumber: endInfo.line,
        endColumn: endInfo.column,
    };
};
