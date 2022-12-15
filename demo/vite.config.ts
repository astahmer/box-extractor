import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

import {
    createVanillaExtractSprinklesExtractor,
    // } from "vite-box-extractor";
} from "../packages/box-extractor";

// https://vitejs.dev/config/
export default defineConfig((env) => ({
    base: "/",
    root: "./",
    build: { outDir: "./dist", sourcemap: true },
    plugins: [
        createVanillaExtractSprinklesExtractor({
            components: ["ColorBox", "DessertBox", "Box"],
            functions: ["colorSprinkles", "themeSprinkles", "minimalSprinkles"],
            vanillaExtractOptions: {
                onAfterEvaluateMutation: (args) => console.dir(args.usedComponents.get("Box"), { depth: null }),
            },
            // vanillaExtractOptions: { identifiers: "short" },
        }),
        // vanillaExtractPlugin() as any,
        react(),
    ],
}));
