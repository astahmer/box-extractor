import { defineConfig } from "vite";
import rakkas from "rakkasjs/vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";
import { createViteVanillaExtractSprinklesExtractor } from "@box-extractor/vanilla-extract/vite-plugin";

export default defineConfig({
    plugins: [
        createViteVanillaExtractSprinklesExtractor({
            components: ["Box", "Stack"],
            functions: ["themeSprinkles"],
            mappedProps: { direction: ["flexDirection"], spacing: ["paddingBottom", "paddingRight"] },
        }) as any,
        tsconfigPaths(),
        rakkas({ filterRoutes: (_route) => "server" }),
    ],
});
