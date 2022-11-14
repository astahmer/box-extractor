import React from "react";
import { createRoot } from "react-dom/client";
import "uno.css";

import "./vite-plugin-react-click-to-component/client";
import App from "./App";
import "./index.css";

const root = createRoot(document.querySelector("#root")!);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
