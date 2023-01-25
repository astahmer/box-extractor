import { Adapter, style } from "@vanilla-extract/css";
import { transformCss } from "@vanilla-extract/css/transformCss";
import { endFileScope, getFileScope, setFileScope } from "@vanilla-extract/css/fileScope";
import { setAdapter, removeAdapter } from "@vanilla-extract/css/adapter";
import { serializeCss, stringifyFileScope, parseFileScope } from "@vanilla-extract/integration";

const context: AdapterContext = {
    cssByFileScope: new Map<string, Css[]>(),
    localClassNames: new Set<string>(),
    composedClassLists: [],
    usedCompositions: new Set<string>(),
};

const cssAdapter: Adapter = {
    appendCss: (css, fileScope) => {
        const serialisedFileScope = stringifyFileScope(fileScope);
        const fileScopeCss = context.cssByFileScope.get(serialisedFileScope) ?? [];

        fileScopeCss.push(css);

        context.cssByFileScope.set(serialisedFileScope, fileScopeCss);
    },
    registerClassName: (className) => {
        context.localClassNames.add(className);
    },
    registerComposition: (composedClassList) => {
        context.composedClassLists.push(composedClassList);
    },
    markCompositionUsed: (identifier) => {
        context.usedCompositions.add(identifier);
    },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onEndFileScope: () => {},
    getIdentOption: () => "debug",
};

setAdapter(cssAdapter);
setFileScope("site/jit-style.ts");

const transformTranslate = style({ transform: "translateX(2px)" });

const fs = getFileScope();
const cssImports = [];
const cssMap = new Map<string, string>();

for (const [serialisedFileScope, fileScopeCss] of context.cssByFileScope) {
    const fileScope = parseFileScope(serialisedFileScope);
    const css = transformCss({
        localClassNames: Array.from(context.localClassNames),
        composedClassLists: context.composedClassLists,
        cssObjs: fileScopeCss,
    }).join("\n");
    cssMap.set(fileScope.filePath, css);

    const fileName = `${fileScope.filePath}.vanilla.css`;

    // let virtualCssFilePath: string;

    // if (serializeVirtualCssPath) {
    //   const serializedResult = serializeVirtualCssPath({
    //     fileName,
    //     fileScope,
    //     source: css,
    //   });

    //   virtualCssFilePath = typeof serializedResult === "string" ? serializedResult : (await serializedResult);
    // } else {
    const serializedCss = await serializeCss(css);

    const virtualCssFilePath = `import '${fileName}?source=${serializedCss}';`;
    // }

    cssImports.push(virtualCssFilePath);
}

endFileScope();
removeAdapter();

console.log({ result: transformTranslate, fs, cssImports });
console.log(context.cssByFileScope.get(stringifyFileScope(fs)));
console.log(cssMap);

type AdapterContext = {
    cssByFileScope: Map<string, Css[]>;
    localClassNames: Set<string>;
    composedClassLists: Composition[];
    usedCompositions: Set<string>;
};

type Css = Parameters<Adapter["appendCss"]>[0];
type Composition = Parameters<Adapter["registerComposition"]>[0];
