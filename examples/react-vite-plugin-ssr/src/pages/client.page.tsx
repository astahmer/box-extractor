import { Box } from "../theme/Box";
import { colorMode } from "../theme/color-mode.css";
import { themeSprinkles } from "../theme/sprinkles.css";
import { Counter } from "./Counter";

export function Page() {
    return (
        <>
            <Counter />
            <Box color="orange.400">boxboxbox</Box>
            <div className={colorMode.light}>
                <div className={themeSprinkles({ backgroundColor: "main" })}>light</div>
            </div>
            <div className={colorMode.dark}>
                <div className={themeSprinkles({ backgroundColor: "secondary" })}>dark</div>
            </div>
        </>
    );
}
