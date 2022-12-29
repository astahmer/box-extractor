import { generateStyles } from "./generate-styles";
import type { AppConfig } from "@remix-kit/schema";
import { ModuleNode, normalizePath, ResolvedConfig, ViteDevServer } from "vite";
import path from "node:path";

let server: ViteDevServer;
let viteConfig: ResolvedConfig;

const getAbsoluteFileId = (source: string) => normalizePath(path.join(viteConfig.root, source));

export default {
    ignoredRouteFiles: ["**/.*"],
    server: "server.prod.ts",
    // appDirectory: "app",
    // assetsBuildDirectory: "public/build",
    serverBuildPath: "build/index.mjs",
    // publicPath: "/build/",
    hooks: {
        "build:before": () => void generateStyles(),
        "vite:extend": ({ config }) => {
            if (!config.plugins) config.plugins = [];

            config.plugins.push({
                name: "box-extractor-remix-kit-dev-server",
                enforce: "pre",
                configResolved(resolved) {
                    viteConfig = resolved;
                },
                configureServer: (devServer) => {
                    server = devServer;
                },
            });

            return config;
        },
        "builder:watch": async (event, path) => {
            if (event !== "change") return;
            if (!path.startsWith("app/routes/") || path === "app/styles/index.css" || path === "app/styles/index.js") {
                return;
            }

            console.log("Watch event", { event, path });

            await generateStyles();

            const absoluteId = getAbsoluteFileId(path);
            const [module] = Array.from(server.moduleGraph.getModulesByFile(absoluteId) ?? []);
            console.log({ path, absoluteId, module: module?.id });
            if (!module) {
                console.log(server.moduleGraph.safeModulesPath);
            }

            if (module) {
                // server.reloadModule()
                server.moduleGraph.invalidateAll();
                // void server.reloadModule(module);
                server.ws.send({ type: "full-reload", path });
                console.log({ path, absoluteId });

                const invalidated = new Set<string>();
                const timestamp = Date.now();
                const invalidate = (mod: ModuleNode | undefined) => {
                    if (!mod?.id) return;
                    if (invalidated.has(mod.id) || path === mod.id) return;

                    invalidated.add(mod.id);
                    server.moduleGraph.invalidateModule(mod);
                    mod.lastHMRTimestamp = timestamp;

                    mod.importers.forEach((nested) => invalidate(nested));
                };

                server.moduleGraph.safeModulesPath.forEach((modPath) => {
                    // TODO only invalidate css.ts impacted by the extract change
                    // ex: we now use `<Box color="red.100" />` in `src/home.tsx`
                    // we need to check where does `red.100` come from (Box)
                    // and then where does Box gets its styles from (src/theme/sprinkles.css.ts)
                    // and then invalidate src/theme/sprinkles.css.ts (and not src/theme/vars.css.ts or src/theme/color-modes.css.ts)
                    if (modPath.includes(".css.ts")) {
                        const maybeModule = server.moduleGraph.getModuleById(getAbsoluteFileId(modPath));
                        invalidate(maybeModule);
                    }
                });
            }
        },
        // "vite:compiled": () => console.log("Vite compiled"),
    },
} as AppConfig;
