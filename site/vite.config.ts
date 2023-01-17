import { defineConfig, UserConfig } from "vite";
import compileTime from "vite-plugin-compile-time";
import UnoCSS from "unocss/vite";
import presetIcons from "@unocss/preset-icons";
import { visualizer } from "rollup-plugin-visualizer";
import { createViteVanillaExtractSprinklesExtractor } from "@box-extractor/vanilla-extract/vite-plugin";
import ssr from "vite-plugin-ssr/plugin";
import react from "@vitejs/plugin-react";

// TODO pwa ?
export default defineConfig((env) => {
    const config: UserConfig = {
        plugins: [
            UnoCSS({ presets: [presetIcons({})] }),
            createViteVanillaExtractSprinklesExtractor({
                // TODO rm Stack/Center
                components: ["Box", "Stack", "Center"],
                mappedProps: { direction: ["flexDirection"], spacing: ["paddingBottom", "paddingRight"] },
                functions: ["themeSprinkles"],
                vanillaExtractOptions: {
                    forceEmitCssInSsrBuild: true,
                },
            }),
            react(),
            ssr({ includeAssetsImportedByServer: true }),
            compileTime(),
        ],
        optimizeDeps: {
            esbuildOptions: {
                define: {
                    global: "globalThis", // for handlebars
                    // https://github.com/vitejs/vite/discussions/5912#discussioncomment-3895047
                },
            },
        },
        resolve: {
            alias: {
                "pastable/server": "pastable",
            },
        },
    };

    if (process.env["VIZ"] && env.command === "build" && !env.ssrBuild) {
        config.plugins!.push(visualizer({ open: true }) as any);
    }

    return config;
});
