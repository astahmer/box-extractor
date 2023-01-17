// `usePageContext` allows us to access `pageContext` in any React component.
// See https://vite-plugin-ssr.com/pageContext-anywhere

import React, { useContext } from "react";
import type { PageContext } from "./types";

const Context = React.createContext<PageContext>(undefined as any);

export function PageContextProvider({
    pageContext,
    children,
}: {
    pageContext: PageContext;
    children: React.ReactNode;
}) {
    return <Context.Provider value={pageContext}>{children}</Context.Provider>;
}

export function usePageContext() {
    return useContext(Context);
}
