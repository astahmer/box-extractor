import type { WithStyledProps } from "@box-extractor/vanilla-wind";
import { Link } from "rakkasjs";
import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";
import { ColorModeToggle } from "../ColorModeToggle/ColorModeToggle";
import { Box } from "../theme/Box";
// import { Stack } from "../theme/components";
import { css } from "../theme/theme";

import "uno.css";
import "./reset.css";
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
                {/* TODO stack + spacing="4" */}
                <Box display="flex" flexDirection="row" alignItems="center" mr="8">
                    <NavLink href="/">Home</NavLink>
                    <NavLink href="/playground">Playground</NavLink>
                    <NavLink href="/docs">Documentation</NavLink>
                    <NavLink
                        href="https://github.com/astahmer/box-extractor"
                        rel="external"
                        target="_blank"
                        display="block"
                    >
                        <Box className="i-mdi-github" fontSize="2xl" />
                    </NavLink>
                    <NavLink
                        href="https://vanilla-extract.style"
                        rel="external"
                        target="_blank"
                        display="flex"
                        alignItems="center"
                    >
                        <Box className="i-ri:cake-3-line" fontSize="2xl" color="purple.400" mr="1" />
                        <Box whiteSpace="nowrap">vanilla-extract</Box>
                    </NavLink>
                    <ColorModeToggle />
                </Box>
            </Box>

            <Box as="section" pt="4" pl="4" h="100%" maxHeight="100%" overflow="auto">
                {children}
            </Box>
        </>
    );
};

export default MainLayout;

const NavLink = ({
    _styled,
    ...props
}: PropsWithChildren<WithStyledProps<typeof css> & ComponentPropsWithoutRef<typeof Link>>) => (
    <Link
        {...props}
        className={[_styled, css({ borderRadius: "md", p: "2", hover: { backgroundColor: "bgSecondary" } })].join(" ")}
    >
        {props.children}
    </Link>
);
