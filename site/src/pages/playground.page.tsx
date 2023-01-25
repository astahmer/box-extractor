import { PlaygroundWithMachine } from "../Playground/PlaygroundWithMachine";
import { Box } from "../theme/Box";

export function Page() {
    return (
        <Box h="100%" maxH="100%" minHeight="0" overflow="auto">
            <PlaygroundWithMachine />
        </Box>
    );
}
