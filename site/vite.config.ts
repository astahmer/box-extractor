import vw from "@box-extractor/vanilla-wind/vite";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import Inspect from "vite-plugin-inspect";

import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import presetIcons from "@unocss/preset-icons";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";
import UnoCSS from "unocss/vite";
import { defineConfig, UserConfig } from "vite";
import compileTime from "vite-plugin-compile-time";
import rakkas from "rakkasjs/vite-plugin";
import path from "path";
import replace from "@rollup/plugin-replace";

const replaceOptions = { preventAssignment: true, __REPLACE_ME_TS_EVAL_PRESET_: "NONE" };

// TODO pwa ?
export default defineConfig((env) => {
    const config: UserConfig = {
        ssr: {
            external: ["ts-toolbelt", "picocolors", "humanize-duration", "@box-extractor/logger", "util"],
            noExternal: ["@box-extractor/logger"],
        },
        plugins: [
            UnoCSS({ presets: [presetIcons({})] }),
            replace(replaceOptions) as any,
            // vw.vanillaWind({ themePath: "./src/theme/theme.ts", include: [/\.[t]sx?$/] }),
            vw.vanillaWind({
                // themePath: "./src/theme/theme.ts",
                include: [/\.[t]sx?$/],
                // esbuild: { plugins: [vanillaExtractPluginEsbuild() as any] },
            }),
            // vw.vanillaWind({ include: [/\.[t]sx?$/], esbuild: { plugins: [vanillaExtractPluginEsbuild() as any] } }),
            // vw.vanillaWind({ include: [/\.[t]sx?$/] }),
            vanillaExtractPlugin(),
            rakkas(),
            // rakkas({ filterRoutes: (_route) => "server" }),
            compileTime(),
            Inspect(),
        ],
        optimizeDeps: {
            include: ["path-browserify", "util"],
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
                util: "util",
                module: path.join(__dirname, "./module.shim.ts"),
            },
        },
    };

    if (process.env["VIZ"] && env.command === "build" && !env.ssrBuild) {
        config.plugins!.push(visualizer({ open: true }) as any);
    }

    return config;
});
