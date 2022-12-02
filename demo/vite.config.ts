import presetIcons from "@unocss/preset-icons";
import react from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";

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
            components: { ColorBox: { properties: "all", conditions: "all" } },
            functions: { colorSprinkles: { properties: "all" } },
        }),
        UnoCSS({ presets: [presetIcons({})] }),
        react(),
    ],
}));
