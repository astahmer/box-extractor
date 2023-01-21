import { createLogger } from "@box-extractor/logger";
import { Project, ts } from "ts-morph";
import { createFilter, normalizePath, Plugin } from "vite";
import type { CreateViteBoxExtractorOptions } from "./createViteBoxExtractor";
import { ensureAbsolute } from "./extensions-helpers";

import {
    findAllTransitiveComponents,
    FindAllTransitiveComponentsOptions,
} from "./extractor/findAllTransitiveComponents";

// Components
// :matches(JsxOpeningElement, JsxSelfClosingElement):has(Identifier[name="ColorBox"]) JsxAttribute > Identifier[name=/color|backgroundColor/] ~ StringLiteral

// Sprinkles fn
// JsxAttributes CallExpression > Identifier[name=/colorSprinkles/]

const logger = createLogger("box-ex:finder:vite");

type TransitiveMap = FindAllTransitiveComponentsOptions["transitiveMap"];

export const createViteBoxRefUsageFinder = ({
    components,
    // functions: _functions = {}, TODO
    onFound,
    tsConfigFilePath = "tsconfig.json",
    project: _project,
    ...options
}: Omit<CreateViteBoxExtractorOptions, "extractMap" | "onExtracted" | "functions"> & {
    onFound: (transitiveMap: TransitiveMap, id: string) => void;
}): Plugin => {
    const componentNames = Array.isArray(components) ? components : Object.keys(components ?? {});

    logger("createViteBoxRefUsageFinder", { components });

    let project: Project = _project!;
    let isIncluded: ReturnType<typeof createFilter>;
    const cacheMap = new Map<string, string>();

    return {
        enforce: "pre",
        name: "vite-box-ref-usage-finder",
        configResolved(config) {
            const root = ensureAbsolute("", config.root);
            const tsConfigPath = ensureAbsolute(tsConfigFilePath, root);
            project =
                project ??
                new Project({
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
        transform(code, id) {
            if (!isIncluded(id)) return null;
            if (cacheMap.has(id) && cacheMap.get(id) === code) {
                logger("[CACHED] no diff", id);
                return null;
            }

            cacheMap.set(id, code);

            // avoid full AST-parsing if possible
            let isUsingExtractableProps = false;
            componentNames.forEach((component) => {
                if (code.includes("<" + component)) {
                    isUsingExtractableProps = true;
                }
            });

            // TODO
            // const functionNames = Array.isArray(functions) ? functions : Object.keys(functions);
            // functionNames.forEach((fn) => {
            //     if (code.includes(fn + "(")) {
            //         isUsingExtractableProps = true;
            //     }
            // });

            if (!isUsingExtractableProps) {
                logger("no used component/functions found", id);
                return null;
            }

            const sourceFile = project.createSourceFile(id.endsWith(".tsx") ? id : id + ".tsx", code, {
                overwrite: true,
                scriptKind: ts.ScriptKind.TSX,
            });

            const transitiveMap: TransitiveMap = new Map();
            findAllTransitiveComponents({ ast: sourceFile, components: componentNames, transitiveMap });

            logger("transitive components", transitiveMap);
            onFound(transitiveMap, id);

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
