import presetIcons from "@unocss/preset-icons";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
// import type { Plugin } from "vite";
import { defineConfig } from "vite";
// import compress from "vite-plugin-compress";

import { createViteBoxExtractor, UsedMap } from "vite-box-extractor";

const usedMap = new Map() as UsedMap;

// https://vitejs.dev/config/
export default defineConfig((env) => ({
    base: "/",
    root: "./",
    build: { outDir: "./dist", sourcemap: true },
    plugins: [
        createViteBoxExtractor({ config: { ColorBox: ["color", "backgroundColor"] }, used: usedMap }),
        UnoCSS({ presets: [presetIcons({})] }),
        react(),
        vanillaExtractPlugin({
            onContextFilled: (context) => {
                // console.log(usedMap)
                // console.log(Object.values(cssByFileScope), {
                // console.dir(Array.from(context.cssByFileScope.values()), { depth: null });
                console.log(usedMap);
                // console.log(
                //     {
                //         localClassNames: context.localClassNames,
                //         composedClassLists: context.composedClassLists,
                //         usedCompositions: context.usedCompositions,
                //     },
                //     { depth: 1000 }
                // );
                // context.cssByFileScope.clear();
                // context.localClassNames.clear();
            },
        }) as any,
        // postVanillaExtractPlugin(),
        // ...(env.mode === "viz" ? [compress()] : []),
        // checker({ typescript: true, overlay: { initialIsOpen: false, position: "tl" } }),
        // Inspect() as any,
    ],
    resolve: {
        alias: [
            {
                find: "@",
                replacement: "/src",
            },
        ],
    },
}));

// const postVanillaExtractPlugin = (): Plugin[] => {
//     return [
//         {
//             name: "post-vanilla-extract-plugin",
//             // enforce: "post",
//             transform(code, id) {
//                 console.log({ id });
//                 if (id.endsWith("components/colors.css.ts")) {
//                     // console.log(code);
//                     // code = code.replace(/\.css\.ts/g, ".css");
//                 }
//                 return code;
//             },
//         },
//     ];
// };
