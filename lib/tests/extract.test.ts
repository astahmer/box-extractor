import { Options, resolveConfig } from "prettier";
import { Project, ts } from "ts-morph";
import { beforeAll, expect, it } from "vitest";
import { extract } from "../src/extract";
import { maybePretty } from "../src/maybePretty";
import { default as ExtractSample } from "./ExtractSample?raw";
import * as path from "node:path";
import { isObject } from "pastable";

let prettierConfig: Options | null;
const pkgRoot = process.cwd();

beforeAll(async () => {
    prettierConfig = await resolveConfig(path.resolve(pkgRoot, "../"));
});

// TODO https://vitest.dev/config/#setupfiles
expect.addSnapshotSerializer({
    serialize(value, config, indentation, depth, refs, printer) {
        if (depth === 0) {
            const prefix = "export const oui = ";
            const prettyOutput = maybePretty(prefix + JSON.stringify(value, null, 4), {
                ...prettierConfig,
                semi: false,
            });
            return prettyOutput.slice(prefix.length);
        }

        return printer(value, config, indentation, depth, refs);
    },
    test(val) {
        return Array.isArray(val) || isObject(val);
    },
});

it("extract", () => {
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
            // allowJs: true,
            // useVirtualFileSystem: true,
        },
        // tsConfigFilePath: tsConfigPath,
        skipAddingFilesFromTsConfig: true,
    });
    const sourceFile = project.createSourceFile("ExtractSample.tsx", ExtractSample);

    expect(extract(sourceFile)).toMatchInlineSnapshot(`
      [
          ["color", "red.200"],
          ["color", "yellow.300"],
          ["backgroundColor", "blackAlpha.100"],
          ["color", ["cyan.400", "cyan.500"]],
          ["color", "facebook.400"],
          ["color", "gray.100"],
          ["color", ["facebook.500", "gray.300"]],
          ["color", ["facebook.600", "gray.200"]],
          ["color", ["gray.200", "gray.300"]],
          ["color", null],
          ["color", null],
          ["color", null],
          ["color", null],
          ["color", null],
          ["color", null],
          ["color", null],
          ["color", null],
          ["color", null],
          ["color", null],
          ["color", null],
          ["color", null],
          ["color", null],
      ]
    `);
});
