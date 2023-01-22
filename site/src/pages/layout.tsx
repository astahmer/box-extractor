import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";
import { ColorModeToggle } from "../ColorModeToggle/ColorModeToggle";
import { Link } from "../renderer/Link";
import { Box, BoxProps } from "../theme/Box";
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
                borderBottomColor="bgHover"
                fontSize="lg"
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
                <Stack flexDirection="row" alignItems="center" spacing="4" mr="8">
                    <NavLink href="/">Home</NavLink>
                    <NavLink href="/playground">Playground</NavLink>
                    <NavLink href="/docs">Documentation</NavLink>
                    <NavLink href="https://github.com/astahmer/box-extractor" rel="external" target="_blank">
                        <Box className="i-mdi-github" fontSize="2xl" />
                    </NavLink>
                    <NavLink
                        href="https://vanilla-extract.style"
                        rel="external"
                        target="_blank"
                        display="flex"
                        alignItems="center"
                        width="8"
                    >
                        <Box className="i-ri:cake-3-line" fontSize="2xl" color="purple.400" mr="1" />
                        vanilla-extract
                    </NavLink>
                    <ColorModeToggle />
                </Stack>
            </Box>

            <Box as="section" pt="4" pl="4" h="100%" maxHeight="100%" overflow="auto">
                {children}
            </Box>
        </>
    );
};

const NavLink = (props: PropsWithChildren<BoxProps & ComponentPropsWithoutRef<typeof Link>>) => (
    <Box as={Link} borderRadius="md" p="2" _hover={{ backgroundColor: "bgSecondary" }} {...props} />
);
