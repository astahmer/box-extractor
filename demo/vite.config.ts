import presetIcons from "@unocss/preset-icons";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";

import {
    createViteBoxExtractor,
    UsedComponentsMap,
    onContextFilled,
    serializeVanillaModuleWithoutUnused,
    // } from "vite-box-extractor";
} from "../lib";

const usedMap = new Map() as UsedComponentsMap;

// https://vitejs.dev/config/
export default defineConfig((env) => ({
    base: "/",
    root: "./",
    build: { outDir: "./dist", sourcemap: true },
    plugins: [
        createViteBoxExtractor({
            components: {
                ColorBox: { properties: ["color", "backgroundColor"], conditions: ["mobile", "tablet", "desktop"] },
            },
            functions: {
                colorSprinkles: { properties: ["color", "backgroundColor"] },
            },
            used: usedMap,
        }),
        UnoCSS({ presets: [presetIcons({})] }),
        react(),
        vanillaExtractPlugin({
            onContextFilled: (context, evalResult) => onContextFilled(context, evalResult, usedMap),
            serializeVanillaModule: (cssImports, exports, context) =>
                serializeVanillaModuleWithoutUnused(cssImports, exports, context, usedMap),
        }) as any,
    ],
}));
