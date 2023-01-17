import "uno.css";
import "./PageShell.css";
import "./reset.css";

import { ReactNode, StrictMode } from "react";
import { MainLayout } from "../pages/layout";
import type { PageContext } from "./types";
import { PageContextProvider } from "./usePageContext";
import { ColorModeProvider } from "../ColorModeToggle/ColorModeToggle";

export function PageShell({ children, pageContext }: { children: ReactNode; pageContext: PageContext }) {
    return (
        <StrictMode>
            <PageContextProvider pageContext={pageContext}>
                <ColorModeProvider>
                    <MainLayout>{children}</MainLayout>
                </ColorModeProvider>
            </PageContextProvider>
        </StrictMode>
    );
}
