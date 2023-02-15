import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { vanillaWind } from "@box-extractor/vanilla-wind/vite";

// https://vitejs.dev/config/
export default defineConfig((_env) => ({
    plugins: [vanillaWind(), react()],
}));
