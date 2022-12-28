import { lightMode, darkMode } from "@box-extractor/vanilla-theme/css";
import { Box, BoxWithCss } from "./Box";

export function BoxDemo() {
    return (
        <Box backgroundColor="gray.200" p="4" borderRadius="2xl">
            {/* <Box color="green.500">green.500</Box>
            <Box color="orange.400">orange.400</Box>
            <div className={lightMode}>
                <Box color="main">lightmode using theme+var</Box>
            </div>
            <div className={darkMode}>
                <Box color="main">darkmode using theme+var</Box>
            </div>

            <Box color={{ hover: "green.100" }}>condition.hover green.100</Box>
            <Box __color="#5f9ea0">escape hatch cadetblue #5f9ea0</Box>
            <Box _hover={{ cursor: "pointer" }}>_hover cursor.pointer</Box>
            <Box color={{ default: "blue.200", hover: "green.400" }} _hover={{ color: "red.300" }}>
                _hover cursor.pointer with default from basic condition object
            </Box> */}
            <Box color="pink.300" _hover={{ color: "yellow.400" }}>
                _hover cursor.pointer with default from prop string
            </Box>
            <Box color={{ desktop: "red.400", tablet: "green.400", mobile: "blue.300" }}>color/responsive rgb</Box>
            <BoxWithCss
                css={{
                    color: "red.400",
                    __alignItems: "baseline",
                    _mobile: { fontSize: "2xl", display: true ? "flex" : "block" },
                    padding: { desktop: "10" },
                }}
            >
                css prop
            </BoxWithCss>

            {/* maybe one day */}
            {/* <Box __color={{ hover: "#dc3e92" }}>escape hatch with condition.hover pink-ish #dc3e92</Box> */}
            {/* <Box _hover={{ __color: "#dc3e92" }}>reversed condition with escape hatch hover.color pink-ish #dc3e92</Box> */}
        </Box>
    );
}
