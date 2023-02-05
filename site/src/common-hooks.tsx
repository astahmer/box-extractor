import type { CommonHooks } from "rakkasjs";
import { ColorModeProvider } from "./ColorModeToggle/ColorModeToggle";

const hooks: CommonHooks = {
    wrapApp(app) {
        return <ColorModeProvider>{app}</ColorModeProvider>;
    },
};

export default hooks;
