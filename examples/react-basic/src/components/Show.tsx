import type { ReactElement, ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

export function Show({
    when,
    children,
    fallback,
    not,
}: {
    children?: ReactNode | (() => ReactNode);
    when: boolean;
    not?: boolean;
    fallback?: ReactNode;
}): ReactElement | null {
    if (not) {
        return null;
    }

    if (when) {
        return (
            <ErrorBoundary fallback={(fallback ?? null) as ReactElement}>
                {typeof children === "function" ? children() : children}
            </ErrorBoundary>
        );
    }

    return (fallback ?? null) as ReactElement;
}
