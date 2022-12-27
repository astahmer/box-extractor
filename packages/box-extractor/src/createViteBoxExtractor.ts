import debug from "debug";
import { Project, ts } from "ts-morph";
import type { FilterPattern, Plugin as VitePlugin } from "vite";
import { createFilter, normalizePath } from "vite";

import { ensureAbsolute } from "./extensions-helpers";

import { extract } from "./extractor/extract";
import type { ExtractOptions, UsedComponentsMap } from "./extractor/types";

// Components
// :matches(JsxOpeningElement, JsxSelfClosingElement):has(Identifier[name="ColorBox"]) JsxAttribute > Identifier[name=/color|backgroundColor/] ~ StringLiteral

// Sprinkles fn
// JsxAttributes CallExpression > Identifier[name=/colorSprinkles/]

export type OnExtractedArgs = {
    extracted: ReturnType<typeof extract>;
    id: string;
    isSsr?: boolean;
    used: UsedComponentsMap;
};
export type CreateViteBoxExtractorOptions = Pick<ExtractOptions, "components" | "functions" | "used"> & {
    onExtracted?: (args: OnExtractedArgs) => void;
    tsConfigFilePath?: string;
    /**
     * Regexp or glob patterns to include matches
     * Once this option is defined, the default one will be overwritten.
     *
     * @default /\.[jt]sx?$/
     */
    include?: FilterPattern;
    /**
     * Regexp or glob patterns to exclude matches
     * Once this option is defined, the default one will be overwritten.
     *
     * @default [/node_modules/,  /\.css\.ts$/]
     */
    exclude?: FilterPattern;
};

const logger = debug("box-ex:extract:vite");

export const createViteBoxExtractor = ({
    components = {},
    functions = {},
    used,
    onExtracted,
    tsConfigFilePath = "tsconfig.json",
    ...options
}: CreateViteBoxExtractorOptions): VitePlugin => {
    let project: Project;
    logger("createViteBoxExtractor", { components, functions });

    let isIncluded: ReturnType<typeof createFilter>;
    const cacheMap = new Map<string, string>();

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
                    allowJs: true,
                    useVirtualFileSystem: true,
                },
                tsConfigFilePath: tsConfigPath,
            });

            isIncluded = createFilter(
                options.include ?? /\.[jt]sx?$/,
                options.exclude ?? [/node_modules/, /\.css\.ts$/],
                { resolve: root }
            );
        },
        transform(code, id, options) {
            // console.log({ id });
            if (!isIncluded(id)) return null;
            if (cacheMap.has(id) && cacheMap.get(id) === code) {
                logger("source hasnt changed", id);
                return null;
            }

            cacheMap.set(id, code);

            let isUsingExtractableProps = false;
            const componentNames = Array.isArray(components) ? components : Object.keys(components);
            componentNames.forEach((component) => {
                if (code.includes("<" + component)) {
                    isUsingExtractableProps = true;
                }
            });

            const functionNames = Array.isArray(functions) ? functions : Object.keys(functions);
            functionNames.forEach((fn) => {
                if (code.includes(fn + "(")) {
                    isUsingExtractableProps = true;
                }
            });

            if (!isUsingExtractableProps) {
                logger("no used component/functions found", id);
                return null;
            }

            const sourceFile = project.createSourceFile(id.endsWith(".tsx") ? id : id + ".tsx", code, {
                overwrite: true,
                scriptKind: ts.ScriptKind.TSX,
            });

            const extracted = extract({ ast: sourceFile, components, functions, used });
            logger("extracted", { id, extracted });

            onExtracted?.({ extracted, id, isSsr: Boolean(options?.ssr), used });
            // console.dir({ id, extracted }, { depth: null });

            return null;
        },
        watchChange(id) {
            // console.log({ id, change });
            if (project && isIncluded(id)) {
                const sourceFile = project.getSourceFile(normalizePath(id));

                sourceFile && project.removeSourceFile(sourceFile);
            }
        },
    };
};
