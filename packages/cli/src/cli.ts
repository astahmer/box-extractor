import { extract, PropNodesMap, unbox } from "@box-extractor/core";

import { Command } from "@molt/command";
import fs from "node:fs";
import * as path from "node:path";
import { Node, Project, ts } from "ts-morph";
import { z } from "zod";

const main = async () => {
    const args = Command.parameters({
        "input i": z.string().describe("input to the file to extract"),
        "output o": z.string().describe("output path to write the extraction result to"),
        tsconfig: z.string().default("tsconfig.json").describe("tsconfig path"),
        functions: z.string().default(""),
        components: z.string().default(""),
    }).parse();
    console.log(args);

    if (!args.components && !args.functions) {
        console.error("please specify at least one component or function");
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(1);
    }

    const root = process.cwd();
    console.log("init project", { root });
    console.time("init project");
    const project = new Project({
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
        tsConfigFilePath: args.tsconfig,
        skipAddingFilesFromTsConfig: true,
        skipLoadingLibFiles: true,
        skipFileDependencyResolution: true,
    });
    const sourceFile = project.addSourceFileAtPath(path.resolve(root, args.input));
    project.resolveSourceFileDependencies();
    console.timeEnd("init project");

    console.log("extracting", args.input);
    console.time("extracting");
    const extracted = extract({
        ast: sourceFile,
        components: args.components.split(",").filter(Boolean),
        functions: args.functions.split(",").filter(Boolean),
    });
    console.timeEnd("extracting");
    console.log("found:", extracted.size);

    const extraction =
        extracted.size === 1
            ? serializeBoxNode(
                  (extracted.values().next().value.queryList as PropNodesMap["queryList"]).map((qb) => ({
                      ...qb,
                      unboxed: unbox(qb.box),
                  }))
              )
            : Array.from(extracted.entries()).flatMap(([_name, map]) =>
                  serializeBoxNode(map.queryList.map((qb) => ({ ...qb, unboxed: unbox(qb.box) })) as any)
              );

    console.log("writing", args.output);
    await fs.promises.writeFile(args.output, extraction, "utf8");
    console.log("done");
};

void main();

function serializeBoxNode(value: unknown) {
    return JSON.stringify(
        value,
        (_key, value) => {
            if (value instanceof Set) {
                return Array.from(value);
            }

            if (value instanceof Map) {
                return Object.fromEntries(value);
            }

            if (Node.isNode(value)) {
                return value.getKindName();
            }

            return value;
        },
        4
    );
}
