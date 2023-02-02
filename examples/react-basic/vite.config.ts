import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// import Inspect from "vite-plugin-inspect";
import { vanillaWind } from "@box-extractor/vanilla-wind/vite";

// https://vitejs.dev/config/
export default defineConfig((_env) => ({
    plugins: [
        // vanillaWind({ themePath: "./src/theme.ts", components: [{ name: "Box", themeName: "tw" }] }),
        // vanillaWind({ themePath: "./src/theme.ts" }),
        vanillaWind(),
        // Inspect({}),
        react(),
    ],
}));
