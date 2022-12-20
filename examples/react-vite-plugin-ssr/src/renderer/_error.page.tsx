export function Page({ is404 }: { is404: boolean }) {
    return is404 ? (
        <>
            <h1>404 Page Not Found</h1>
            <p>This page could not be found.</p>
        </>
    ) : (
        <>
            <h1>500 Internal Server Error</h1>
            <p>Something went wrong.</p>
        </>
    );
}
