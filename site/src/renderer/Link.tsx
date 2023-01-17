import type { ComponentPropsWithoutRef } from "react";
import { usePageContext } from "./usePageContext";

export function Link(props: ComponentPropsWithoutRef<"a">) {
    const pageContext = usePageContext();
    const className = [props.className, pageContext.urlPathname === props.href && "active"].filter(Boolean).join(" ");
    return <a {...props} className={className} />;
}
