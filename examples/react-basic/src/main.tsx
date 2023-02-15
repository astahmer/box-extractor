import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
// import { DjangoApp } from "./django/django-entrypoint";
// import "uno.css";

// import App from "./App";

const root = createRoot(document.querySelector("#root")!);
root.render(
    <React.StrictMode>
        <App />
        {/* <DjangoApp /> */}
    </React.StrictMode>
);
