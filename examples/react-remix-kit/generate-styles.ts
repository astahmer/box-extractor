import type { UsedComponentsMap } from "@box-extractor/core";
import { createEsbuildVanillaExtractSprinklesExtractor } from "@box-extractor/vanilla-extract/esbuild-plugin";
import esbuild from "esbuild";
import { globPlugin } from "esbuild-plugin-glob";
import { cleanPlugin } from "esbuild-clean-plugin";
import { nodeExternals } from "esbuild-plugin-node-externals";

export const generateStyles = async () => {
    console.log("extracting sprinkles usage...");
    let used: UsedComponentsMap;
    await esbuild.build({
        entryPoints: ["./app/routes/**.tsx"],
        write: false,
        outdir: "app/styles",
        plugins: [
            globPlugin(),
            ...(createEsbuildVanillaExtractSprinklesExtractor({
                components: ["Box"],
                functions: ["themeSprinkles"],
                onExtracted: (args) => {
                    used = args.used;
                },
            }) as any),
        ],
    });
    console.log("extract done !");
    console.dir(used!, { depth: null });

    console.log("building styles...");
    await esbuild.build({
        // entryPoints: ["./node_modules/@box-extractor/vanilla-theme/src/css/*.css.ts"],
        entryPoints: ["./node_modules/@box-extractor/vanilla-theme/src/css/index.ts"],
        outdir: "app/styles",
        splitting: false,
        metafile: true,
        format: "cjs",
        target: "esnext",
        bundle: true,
        plugins: [
            cleanPlugin(),
            globPlugin(),
            nodeExternals(),
            createEsbuildVanillaExtractSprinklesExtractor({
                components: ["Box"],
                functions: ["themeSprinkles"],
                used: used!,
            })[1] as any,
        ],
    });
    console.log("done building styles !");
};

// eslint-disable-next-line unicorn/prefer-top-level-await
// void generateStyles()
