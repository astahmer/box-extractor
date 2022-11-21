import presetIcons from "@unocss/preset-icons";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";
import * as path from "node:path";

import {
    createViteBoxExtractor,
    UsedMap,
    onContextFilled,
    serializeVanillaModuleWithoutUnused,
    // } from "vite-box-extractor";
} from "../lib";

const usedMap = new Map() as UsedMap;
console.log(path.resolve(__dirname, "../lib"));

// https://vitejs.dev/config/
export default defineConfig((env) => ({
    base: "/",
    root: "./",
    build: { outDir: "./dist", sourcemap: true },
    plugins: [
        createViteBoxExtractor({ config: { ColorBox: ["color", "backgroundColor"] }, used: usedMap }),
        UnoCSS({ presets: [presetIcons({})] }),
        react(),
        vanillaExtractPlugin({
            // TODO try with multiple .css.ts files
            onContextFilled: (context, evalResult) => onContextFilled(context, evalResult, usedMap),
            serializeVanillaModule: (cssImports, exports, context) =>
                serializeVanillaModuleWithoutUnused(cssImports, exports, context, usedMap),
        }) as any,
    ],
}));
