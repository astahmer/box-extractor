import { Box } from "../theme/Box";
import { tw } from "../theme/theme";
import { Counter } from "./Counter";

export function Page() {
    return (
        <>
            <Counter />
            <Box color="orange.400">boxboxbox</Box>
            <div className={tw({ backgroundColor: "main" })}>main bg</div>
        </>
    );
}
