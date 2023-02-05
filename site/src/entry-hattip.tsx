import { createRequestHandler } from "rakkasjs";
import { themeKey } from "./ColorModeToggle/ColorModeToggle";
import { lightMode, darkMode } from "./theme/css/color-mode.css";

export default createRequestHandler({
    createPageHooks(_requestContext) {
        return {
            emitToDocumentHead() {
                // Return a string to emit some HTML into the
                // document's head.

                return `<script>((d)=>{try{var p=localStorage.getItem('${themeKey}');if(p==d||(p!='${lightMode}'&&matchMedia('(prefers-color-scheme:dark)').matches)) document.documentElement.classList.add(d); else document.documentElement.classList.add("${lightMode}")}catch(e){}})('${darkMode}');</script>`;
            },
        };
    },
});
