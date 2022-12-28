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
            components: ["ColorBox", "DessertBox", "Box", "BoxWithCss"],
            functions: ["colorSprinkles", "themeSprinkles", "minimalSprinkles"],
            include: ["./src/components/**/*.tsx"],
            onExtracted(args) {
                const BoxWithCss = args.used.get("BoxWithCss");
                if (!BoxWithCss) return;

                console.dir(BoxWithCss, { depth: null });
                const css = BoxWithCss.conditionalProperties.get("css");
                if (!css) return;

                console.log(css);

                // css.forEach(())
            },
            // vanillaExtractOptions: {
            //     onAfterEvaluateMutation: (args) => console.dir(args.usedComponents.get("Box"), { depth: null }),
            // },
        }),
        // vanillaExtractPlugin() as any,
        react(),
    ],
}));
