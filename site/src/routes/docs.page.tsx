import { Link } from "rakkasjs";
import { Box } from "../theme/Box";

export const Page = () => (
    <main>
        TODO sorry, in the meantime there is
        <Box
            as={Link}
            href="https://paka.dev/npm/@box-extractor/core"
            rel="external"
            target="_blank"
            ml="0.5"
            px="2"
            py="1"
            borderRadius="md"
            hover={{ backgroundColor: "bgSecondary" }}
        >
            this autogenerated documentation
        </Box>
    </main>
);

export default Page;
