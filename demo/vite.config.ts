import presetIcons from "@unocss/preset-icons";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";
import compress from "vite-plugin-compress";

import { createViteBoxExtractor } from "vite-box-extractor";

// https://vitejs.dev/config/
export default defineConfig((env) => ({
    base: "/",
    root: "./",
    build: { outDir: "./dist", sourcemap: true },
    plugins: [
        createViteBoxExtractor(),
        UnoCSS({
            presets: [presetIcons({})],
        }),
        react(),
        vanillaExtractPlugin(),
        ...(env.mode === "viz" ? [compress()] : []),
        // checker({ typescript: true, overlay: { initialIsOpen: false, position: "tl" } }),
        // Inspect() as any,
    ],
    resolve: {
        alias: [
            {
                find: "@",
                replacement: "/src",
            },
        ],
    },
}));
