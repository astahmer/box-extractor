import ReactDOMServer from "react-dom/server";
import { PageShell } from "./PageShell";
import { escapeInject, dangerouslySkipEscape } from "vite-plugin-ssr";
import logoUrl from "./logo.svg";
import type { PageContextServer } from "./types";
import { colorMode } from "../theme/color-mode.css";

// See https://vite-plugin-ssr.com/data-fetching
export const passToClient = ["pageProps", "urlPathname"];

export async function render(pageContext: PageContextServer) {
    const { Page, pageProps } = pageContext;
    const pageHtml = ReactDOMServer.renderToString(
        <PageShell pageContext={pageContext}>
            <Page {...pageProps} />
        </PageShell>
    );

    // See https://vite-plugin-ssr.com/head
    const { documentProps } = pageContext.exports;
    const title = documentProps?.title ?? "Vite SSR app";
    const desc = documentProps?.description ?? "App using Vite + vite-plugin-ssr";

    // ColorMode script
    // https://github.com/vanilla-extract-css/vanilla-extract/blob/9312b66e5bd67942b7929a6b93e0ad2181b2e0ba/site/src/render.tsx#L55
    const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="en">
      <head>
        <script>
        ((d)=>{try{var p=localStorage.getItem('${colorMode.localStorageKey}');if(p==d||(p!='${
        colorMode.light
    }'&&matchMedia('(prefers-color-scheme:dark)').matches)) document.documentElement.classList.add(d)}catch(e){}})('${
        colorMode.dark
    }')
        </script>
        <meta charset="UTF-8" />
        <link rel="icon" href="${logoUrl}" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="${desc}" />
        <title>${title}</title>
      </head>
      <body>
        <div id="page-view">${dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`;

    return {
        documentHtml,
        pageContext: {
            // We can add some `pageContext` here, which is useful if we want to do page redirection https://vite-plugin-ssr.com/page-redirection
        },
    };
}
