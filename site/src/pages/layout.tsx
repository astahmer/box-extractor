import type { PropsWithChildren } from "react";
import { Link } from "../renderer/Link";
import { Box } from "../theme/Box";
import { Stack } from "../theme/components";

import "./layout.css";

const version: string = import.meta.compileTime("../macros/get-package-version.ts");

export const MainLayout = ({ children }: PropsWithChildren) => {
    return (
        <>
            <Box
                as="header"
                display="flex"
                alignItems="flex-end"
                justifyContent="space-between"
                borderBottom="1px"
                // TODO
                // borderBottomColor="bgHover"
                py="5"
                px="4"
            >
                <Box fontWeight="bold" fontSize={"2xl"}>
                    <Box
                        fontSize="2xl"
                        as={Link}
                        href="https://github.com/astahmer/box-extractor"
                        rel="external"
                        target="_blank"
                    >
                        @box-extractor/core v{version}
                    </Box>
                </Box>
                <Stack flexDirection="row">
                    <Box
                        as={Link}
                        href="/"
                        px="2"
                        py="1"
                        borderRadius="md"
                        // _hover={{ backgroundColor: "bg-darker" }}
                        // activeClass="activeLink"
                    >
                        Playground
                    </Box>
                    <Box
                        as={Link}
                        href="/docs"
                        px="2"
                        py="1"
                        borderRadius="md"
                        // _hover={{ backgroundColor: "bg-darker" }}
                        // activeClass="activeLink"
                    >
                        Documentation
                    </Box>
                    <Box
                        as={Link}
                        href="https://github.com/astahmer/box-extractor"
                        rel="external"
                        target="_blank"
                        px="2"
                        py="1"
                        borderRadius="md"
                        // _hover={{ backgroundColor: "bg-darker" }}
                    >
                        <Box className="i-mdi-github" boxSize={1.5} />
                    </Box>
                    <Box
                        as={Link}
                        href="https://vanilla-extract.style"
                        rel="external"
                        target="_blank"
                        px="2"
                        py="1"
                        borderRadius="md"
                        // _hover={{ backgroundColor: "bg-darker" }}
                        display="flex"
                        alignItems="center"
                    >
                        <Box className="i-ic-outline-diamond" boxSize={1.5} color="purple.400" mr="1" />
                        vanilla-extract
                    </Box>
                    {/* <ColorModeSwitchIconButton /> */}
                </Stack>
            </Box>

            <Box as="section" pt="4" pl="4" h="100%" maxHeight="100%" overflow="auto">
                {children}
            </Box>
        </>
    );
};

// const ColorModeSwitchIconButton = () => {
//     const { colorMode, toggleColorMode } = useColorMode();
//     return (
//         <IconButton
//             aria-label="Color mode switch"
//             onClick={toggleColorMode}
//             size="sm"
//             icon={
//                 colorMode === "light" ? (
//                     <Box className="i-material-symbols-sunny" boxSize="1em" />
//                 ) : (
//                     <Box className="i-ri-moon-clear-fill" boxSize="1em" />
//                 )
//             }
//         />
//     );
// };
