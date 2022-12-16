import express from "express";
import compression from "compression";
import { renderPage } from "vite-plugin-ssr";
import sirv from "sirv";
import path from "node:path";
import * as vite from "vite";

const isProduction = process.env.NODE_ENV === "production";
const url = new URL(import.meta.url);
const root = path.resolve(url.pathname, "../../..");

// eslint-disable-next-line unicorn/prefer-top-level-await
void startServer();

async function startServer() {
    const app = express(); // TODO fastify ?
    // https://github.com/giacomorebonato/vite-plugin-ssr-fastify/blob/main/server/index.ts

    app.use(compression());

    if (isProduction) {
        app.use(sirv(`${root}/dist/client`));
    } else {
        const devServer = await vite.createServer({
            root,
            server: { middlewareMode: true, open: true },
        });
        const viteDevMiddleware = devServer.middlewares;
        app.use(viteDevMiddleware);
    }

    app.get("*", async (req, res, next) => {
        const pageContextInit = {
            urlOriginal: req.originalUrl,
        };
        const pageContext = await renderPage(pageContextInit);
        const { httpResponse } = pageContext;
        if (!httpResponse) return void next();
        const { body, statusCode, contentType, earlyHints } = httpResponse;
        if (res.writeEarlyHints) res.writeEarlyHints({ link: earlyHints.map((e) => e.earlyHintLink) });
        res.status(statusCode).type(contentType).send(body);
    });

    const port = process.env.PORT ?? 3000;
    app.listen(port);
    console.log(`Server running at http://localhost:${port}`);
}
