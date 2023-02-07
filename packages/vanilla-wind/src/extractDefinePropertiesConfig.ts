import type { SourceFile } from "ts-morph";
import { extractFunctionFrom, unbox } from "@box-extractor/core";
import type { GenericConfig } from "./defineProperties";

export const extractDefinePropertiesConfig = (sourceFile: SourceFile) => {
    const configByName = new Map<string, GenericConfig>();
    const extracted = extractFunctionFrom(
        sourceFile,
        "defineProperties",
        (boxNode) => unbox(boxNode.value[0]) as GenericConfig,
        {
            importName: "@box-extractor/vanilla-wind",
            // TODO is it really needed ?
            canImportSourcePath: (sourcePath) => sourcePath.includes("vanilla-wind/dist"),
        }
    );
    extracted.forEach((extract, name) => configByName.set(name, extract.result));

    return configByName;
};
