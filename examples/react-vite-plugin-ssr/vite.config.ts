import react from "@vitejs/plugin-react";
import ssr from "vite-plugin-ssr/plugin";
import type { UserConfig } from "vite";
import { createViteVanillaExtractSprinklesExtractor } from "@box-extractor/vanilla-extract/vite";
// import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import mdx from "@mdx-js/rollup";

import rehypeSlug from "rehype-slug";
import rehypeExtractToc from "@stefanprobst/rehype-extract-toc";
import rehypeExtractTocMdx from "@stefanprobst/rehype-extract-toc/mdx";
import remarkGfm from "remark-gfm";

// TODO preact + mdx (check tropical)
const config: UserConfig = {
    plugins: [
        createViteVanillaExtractSprinklesExtractor({
            components: ["Box"],
            functions: ["themeSprinkles"],
            vanillaExtractOptions: {
                forceEmitCssInSsrBuild: true,
            },
        }),
        react(),
        mdx({
            rehypePlugins: [rehypeSlug, rehypeExtractToc, rehypeExtractTocMdx],
            remarkPlugins: [remarkGfm],
            providerImportSource: "@mdx-js/react",
        }),
        ssr({
            includeAssetsImportedByServer: true,
        }),
        // vanillaExtractPlugin({ forceEmitCssInSsrBuild: true }),
    ],
};

export default config;
