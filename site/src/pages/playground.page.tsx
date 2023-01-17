import { Playground } from "../Playground/Playground";
import { Box } from "../theme/Box";

export function Page() {
    return (
        <Box h="100%" maxH="100%" minHeight="0" overflow="auto">
            <Playground />
        </Box>
    );
}
