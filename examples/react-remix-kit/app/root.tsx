import { ReactRefresh } from "@remix-kit/react";
import type { MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, useLoaderData } from "@remix-run/react";
// import stylesUrl from "./styles/tailwind.css?url";
import stylesUrl from "./styles/index.css?url";

export const meta: MetaFunction = () => ({
    // eslint-disable-next-line unicorn/text-encoding-identifier-case
    charset: "utf-8",
    title: "My Remix App",
    viewport: "width=device-width,initial-scale=1",
});

export async function loader() {
    return json({ test: "Root Loader Data Test" });
}

export function links() {
    return [{ rel: "stylesheet", href: stylesUrl }];
}

export default function App() {
    const data = useLoaderData<typeof loader>();
    return (
        <html lang="en">
            <head>
                <Meta />
                <ReactRefresh />
                <Links />
            </head>
            <body>
                <Outlet />
                <Scripts />
                {data.test}
            </body>
        </html>
    );
}
