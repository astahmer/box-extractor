import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { createViteVanillaExtractSprinklesExtractor } from "@box-extractor/vanilla-extract/vite";

// https://vitejs.dev/config/
export default defineConfig((_env) => ({
    base: "/",
    root: "./",
    build: { outDir: "./dist", sourcemap: true },
    plugins: [
        createViteVanillaExtractSprinklesExtractor({
            components: ["ColorBox", "DessertBox", "Box"],
            functions: ["colorSprinkles", "themeSprinkles", "minimalSprinkles"],
            // vanillaExtractOptions: {
            //     onAfterEvaluateMutation: (args) => console.dir(args.usedComponents.get("Box"), { depth: null }),
            // },
        }),
        // vanillaExtractPlugin() as any,
        react(),
    ],
}));
