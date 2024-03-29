// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
    "@@xstate/typegen": true;
    internalEvents: {
        "xstate.init": { type: "xstate.init" };
    };
    invokeSrcNameMap: {};
    missingImplementations: {
        actions: never;
        delays: never;
        guards: never;
        services: never;
    };
    eventsCausingActions: {
        assignEditorRef: "Editor Loaded";
        selectIdentifier: "Select identifier";
        selectMode: "Select mode";
        selectNode: "Select node";
        selectProp: "Select prop";
        updateComponents: "Update components";
        updateFunctions: "Update functions";
        updateHighlight: "Select identifier" | "Select node" | "Select prop";
        updateOutput: "Update components" | "Update functions" | "Update input";
        updateSearchFilter: "Update search filter";
    };
    eventsCausingDelays: {};
    eventsCausingGuards: {};
    eventsCausingServices: {};
    matchesStates: "loading" | "ready" | "ready.Playing" | { ready?: "Playing" };
    tags: never;
}
