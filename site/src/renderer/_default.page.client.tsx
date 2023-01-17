import { hydrateRoot } from "react-dom/client";
import { PageShell } from "./PageShell";
import type { PageContextClient } from "./types";

export async function render(pageContext: PageContextClient) {
    const { Page, pageProps } = pageContext;

    hydrateRoot(
        document.querySelector("#page-view")!,
        <PageShell pageContext={pageContext}>
            <Page {...pageProps} />
        </PageShell>
    );
}

/* To enable Client-side Routing:
export const clientRouting = true
// !! WARNING !! Before doing so, read https://vite-plugin-ssr.com/clientRouting */
