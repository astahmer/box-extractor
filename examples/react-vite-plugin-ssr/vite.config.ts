import react from "@vitejs/plugin-react";
import ssr from "vite-plugin-ssr/plugin";
import type { UserConfig } from "vite";
import mdx from "@mdx-js/rollup";

import rehypeSlug from "rehype-slug";
import rehypeExtractToc from "@stefanprobst/rehype-extract-toc";
import rehypeExtractTocMdx from "@stefanprobst/rehype-extract-toc/mdx";
import remarkGfm from "remark-gfm";
import { vanillaWind } from "@box-extractor/vanilla-wind/vite";

// TODO preact + mdx (check tropical)
const config: UserConfig = {
    plugins: [
        vanillaWind(),
        react(),
        mdx({
            rehypePlugins: [rehypeSlug, rehypeExtractToc, rehypeExtractTocMdx],
            remarkPlugins: [remarkGfm],
            providerImportSource: "@mdx-js/react",
        }),
        ssr({
            includeAssetsImportedByServer: true,
        }),
    ],
};

export default config;
