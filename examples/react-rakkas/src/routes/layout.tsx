// This is the main layout of our app. It renders the header and the footer.

import { themeSprinkles } from "@box-extractor/vanilla-theme/css";
import { Head, Link, StyledLink, Layout } from "rakkasjs";
import { Box, BoxProps, PolymorphicComponentProps } from "src/theme/Box";
import { Stack } from "src/theme/components";

import "./layout.css";

const MainLayout: Layout = ({ children }) => (
    <>
        {/* Rakkas relies on react-helmet-async for managing the document head */}
        {/* See their documentation: https://github.com/staylor/react-helmet-async#readme */}
        <Head title="Rakkas Demo App" />

        <Box
            as="header"
            w="100%"
            display="flex"
            flexWrap="wrap"
            alignItems="flex-end"
            justifyContent="space-between"
            p={4}
            borderStyle="solid"
            borderBottomWidth="1px"
            borderBottomColor="gray.200"
            _tablet={{ justifyContent: "center" }}
        >
            {/* <Link /> is like <a /> but it provides client-side navigation without full page reload. */}
            <Box as={Link} __fontSize="150%" fontWeight="bold" href="/">
                Rakkas Demo App
            </Box>

            <Stack as="nav" direction="row" spacing="4" p="0" m="0">
                {/* <StyledLink /> is like <Link /> but it can be styled based on the current route ()which is useful for navigation links). */}
                <NavLink href="/">Home</NavLink>
                <NavLink href="/about">About</NavLink>
                <NavLink href="/todo">Todo</NavLink>
            </Stack>
        </Box>

        <Box as="section" pr="4" pb="4" __minHeight="calc(100vh - 16rem)">
            {children}
        </Box>

        <Box
            as="footer"
            fontSize="sm"
            textAlign="center"
            marginTop="8"
            p="4"
            borderTop="1px"
            borderColor="gray.300"
            borderStyle="solid"
        >
            <p>Software and documentation: Copyright 2021 Fatih Aygün. MIT License.</p>

            <p>
                Favicon: “Flamenco” by{" "}
                <a href="https://thenounproject.com/term/flamenco/111303/">gzz from Noun Project</a> (not affiliated).
                <br />
                Used under{" "}
                <a href="https://creativecommons.org/licenses/by/2.0/">
                    Creative Commons Attribution Generic license (CCBY)
                </a>
            </p>
        </Box>
    </>
);

const NavLink = (props: PolymorphicComponentProps<BoxProps, typeof StyledLink>) => (
    <Box
        as={StyledLink}
        p={2}
        borderRadius="md"
        activeClass={themeSprinkles({ backgroundColor: "gray.200" })}
        {...props}
    />
);

export default MainLayout;
