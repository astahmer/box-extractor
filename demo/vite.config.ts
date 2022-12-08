import presetIcons from "@unocss/preset-icons";
import react from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

import {
    createVanillaExtractSprinklesExtractor,
    // } from "vite-box-extractor";
} from "../lib";

// https://vitejs.dev/config/
export default defineConfig((env) => ({
    base: "/",
    root: "./",
    build: { outDir: "./dist", sourcemap: true },
    plugins: [
        createVanillaExtractSprinklesExtractor({
            components: ["ColorBox", "DessertBox"],
            functions: ["colorSprinkles", "themeSprinkles", "minimalSprinkles"],
            // vanillaExtractOptions: { identifiers: "short" },
        }),
        // vanillaExtractPlugin() as any,
        UnoCSS({ presets: [presetIcons({})] }),
        react(),
    ],
}));
