import { createViteVanillaExtractSprinklesExtractor } from "@box-extractor/vanilla-extract/vite-plugin";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import presetIcons from "@unocss/preset-icons";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";
import UnoCSS from "unocss/vite";
import { defineConfig, UserConfig } from "vite";
import compileTime from "vite-plugin-compile-time";
import ssr from "vite-plugin-ssr/plugin";
import path from "path";
import replace from "@rollup/plugin-replace";

const replaceOptions = { preventAssignment: true, __REPLACE_ME_TS_EVAL_PRESET_: "NONE" };

// TODO pwa ?
export default defineConfig((env) => {
    const config: UserConfig = {
        ssr: {
            external: ["ts-toolbelt", "picocolors"],
        },
        plugins: [
            UnoCSS({ presets: [presetIcons({})] }),
            replace(replaceOptions),
            createViteVanillaExtractSprinklesExtractor({
                components: ["Box", "box.*"],
                mappedProps: { direction: ["flexDirection"], spacing: ["paddingBottom", "paddingRight"] },
                functions: ["themeSprinkles"],
                vanillaExtractOptions: {
                    identifiers: "short",
                    forceEmitCssInSsrBuild: true,
                },
            }),
            react(),
            ssr({ includeAssetsImportedByServer: true }),
            compileTime(),
        ],
        optimizeDeps: {
            include: ["path-browserify"],
            esbuildOptions: {
                define: {
                    global: "globalThis",
                    "process.env.NODE_ENV": "'dev'",
                },
                plugins: [NodeGlobalsPolyfillPlugin({ process: true }) as any],
            },
        },
        resolve: {
            alias: {
                // needed shims for tsquery / ts-evaluator to work in the browser
                process: "process/browser",
                esquery: resolve("node_modules/esquery/dist/esquery.js"), // yes it's needed, no idea why it works, solves Uncaught TypeError: esquery.parse is not a function
                os: "os-browserify",
                path: "path-browserify",
                module: path.join(__dirname, "./module.shim.ts"),
            },
        },
    };

    if (process.env["VIZ"] && env.command === "build" && !env.ssrBuild) {
        config.plugins!.push(visualizer({ open: true }) as any);
    }

    return config;
});
