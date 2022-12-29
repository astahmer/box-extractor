import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";
import { createViteVanillaExtractSprinklesExtractor } from "@box-extractor/vanilla-extract/vite-plugin";

export default defineConfig({
    plugins: [
        Inspect(),
        createViteVanillaExtractSprinklesExtractor({
            components: ["Box"],
            functions: ["themeSprinkles"],
        }) as any,
    ],
});
