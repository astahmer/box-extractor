import { startClient } from "rakkasjs";
import { themeKey } from "./ColorModeToggle/ColorModeToggle";
import { darkMode, lightMode } from "./theme/css/color-mode.css";

void startClient({
    hooks: {
        beforeStart() {
            // ((d) => {
            //     try {
            //         const p = localStorage.getItem(themeKey);
            //         if (p == d || (p != lightMode && matchMedia("(prefers-color-scheme:dark)").matches))
            //             document.documentElement.classList.add(d);
            //     } catch {}
            // })(darkMode);
        },
    },
});
