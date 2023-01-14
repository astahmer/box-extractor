import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { createViteVanillaExtractSprinklesExtractor } from "@box-extractor/vanilla-extract/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig((_env) => ({
    base: "/",
    root: "./",
    build: { outDir: "./dist", sourcemap: true },
    plugins: [
        createViteVanillaExtractSprinklesExtractor({
            components: ["ColorBox", "DessertBox", "Box"],
            sprinkles: ["colorSprinkles", "themeSprinkles", "minimalSprinkles"],
            recipes: ["button"],
        }),
        // vanillaExtractPlugin() as any,
        react(),
    ],
}));
