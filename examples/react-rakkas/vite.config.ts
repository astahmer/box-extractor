import { defineConfig } from "vite";
import rakkas from "rakkasjs/vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";
import vw from "@box-extractor/vanilla-wind/vite";

export default defineConfig({
    ssr: {
        external: ["ts-toolbelt"],
    },
    plugins: [
        vw.vanillaWind({
            include: [/\.[t]sx?$/],
        }) as any,
        tsconfigPaths(),
        rakkas({ filterRoutes: (_route) => "server" }),
    ],
});
