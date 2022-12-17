import { Box } from "../theme/Box";
import { lightMode, darkMode, themeSprinkles } from "@box-extractor/vanilla-theme/css";
import { Counter } from "./Counter";

export function Page() {
    return (
        <>
            <Counter />
            <Box color="orange.400">boxboxbox</Box>
            <div className={lightMode}>
                <div className={themeSprinkles({ backgroundColor: "main" })}>light</div>
            </div>
            <div className={darkMode}>
                <div className={themeSprinkles({ backgroundColor: "secondary" })}>dark</div>
            </div>
        </>
    );
}
