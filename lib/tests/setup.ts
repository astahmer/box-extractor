import * as path from "node:path";
import { isObject } from "pastable";
import { Options, resolveConfig } from "prettier";
import { beforeAll, expect } from "vitest";
import { maybePretty } from "./maybePretty";

let prettierConfig: Options | null;
const pkgRoot = process.cwd();

beforeAll(async () => {
    prettierConfig = await resolveConfig(path.resolve(pkgRoot, "../"));
});

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
