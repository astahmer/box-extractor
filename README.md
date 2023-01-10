# box-extractor

# What is this

https://twitter.com/astahmer_dev/status/1601244606133567488

![Screenshot 2022-12-18 at 11 35 31](https://user-images.githubusercontent.com/47224540/208293575-811808ac-db7f-4443-b977-323a9cf25ac9.png)

https://twitter.com/astahmer_dev/status/1601246126396428289

# Installation

## core

if you need the static analysis (using [ts-morph](https://github.com/dsherret/ts-morph) + [tsquery](https://github.com/phenomnomnominal/tsquery/)) on components props/functions args:

```ts
pnpm add @box-extractor/core
```

## [@vanilla-extract/sprinkles](https://vanilla-extract.style/documentation/packages/sprinkles/) adapter

if you need the `@vanilla-extract/sprinkles` adapter to remove any unused css classes and make your own `<Box />` :

```ts
pnpm add @box-extractor/vanilla-extract
```

then in your `vite.config.ts` add the plugin and list your sprinkles functions + your root component (those using a sprinkles function)

a root component using a sprinkles fn could look like this:

// Box.ts

```ts
const Box = ({ children, ...props }) => <div className={themeSprinkles(props)}>{children}</div>;
```

// vite.plugin.ts

```ts
import react from "@vitejs/plugin-react";
import type { UserConfig } from "vite";
import { createViteVanillaExtractSprinklesExtractor } from "@box-extractor/vanilla-extract/vite-plugin";

const config: UserConfig = {
    plugins: [
        createViteVanillaExtractSprinklesExtractor({
            components: ["Box"],
            functions: ["themeSprinkles"],
        }),
        react(),
    ],
};

export default config;
```

### Temporary workaround

While waiting [for the PR I made](https://github.com/vanilla-extract-css/vanilla-extract/pull/942) to the `vanilla-extract` repo adding callbacks necessary for the extractor plugin to purge unused css classes, a workaround is to use the [forked versions](./packages//vanilla-extract/ve-fork-tgz/) as [remote tarballs](https://pnpm.io/cli/add#install-from-remote-tarball) using a `readPackage` hook from a [`.pnpmfile.cjs`](https://pnpm.io/pnpmfile) to install the dependencies.

TL;DR:

-   copy this file below next to your `package.json`
-   `pnpm i`
-   that's it

// .pnpmfile.cjs

```js
const baseUrl =
    "https://github.com/astahmer/box-extractor/raw/main/packages/vanilla-extract/ve-fork-tgz/vanilla-extract-";

function readPackage(pkg, context) {
    // Override the manifest of @box-extractor/vanilla-extract" after downloading it from the registry
    if (pkg.name === "@box-extractor/vanilla-extract") {
        context.log("[@box-extractor/vanilla-extract]: Replacing link: with git: dependencies");
        Object.entries(pkg.dependencies).forEach(([key, value]) => {
            if (value.includes("link:")) {
                const packageName = key.split("/").pop();
                pkg.dependencies[key] = baseUrl + packageName + ".tgz";
                context.log(`[${key}]: Replaced with ${pkg.dependencies[key]}}`);
            }
        });
    }

    if (pkg.name === "@vanilla-extract/vite-plugin" || pkg.name === "@vanilla-extract/esbuild-plugin") {
        context.log(`[${pkg.name}]: Replacing @vanilla-extract/integration with local version`);

        pkg.dependencies["@vanilla-extract/integration"] = baseUrl + "integration.tgz";
    }

    return pkg;
}

module.exports = {
    hooks: {
        readPackage,
    },
};
```

## @box-extractor/vanilla-theme - Chakra/Tailwind sprinkle

There is a [preconfigured sprinkle](https://github.com/astahmer/box-extractor/blob/main/packages/vanilla-theme/src/css/properties.css.ts) available enabling a Chakra-UI/Tailwind -like DX with lots of properties/conditions/values out-of-the-box.

It was made by using most of [Chakra-UI default theme](https://github.com/chakra-ui/chakra-ui/tree/main/packages/components/theme/src/foundations) + most of the [pseudo props](https://chakra-ui.com/docs/styled-system/style-props#pseudo) available in their `<Box />` component.

You currently need to use a forked version of the `@vanilla-extract/css` package because of performance reasons : It takes more than 20 or 30s to `eval` (from `@vanilla-extract/vite-plugin` -> `processVanillaFile` -> `eval`) because of a HUGE regex that performs very slowly on `node_modules/xxx` paths.

You can do so like this:

// package.json

```json
"@vanilla-extract/css": "https://github.com/astahmer/box-extractor/raw/main/packages/vanilla-extract/ve-fork-tgz/vanilla-extract-css.tgz",
```

### [vite-plugin-ssr](https://vite-plugin-ssr.com/)

There is an [example in the repo](https://github.com/astahmer/box-extractor/tree/main/examples/react-vite-plugin-ssr), but the gist of it can be summarized to this:

// vite.plugin.ts

```ts
import react from "@vitejs/plugin-react";
import ssr from "vite-plugin-ssr/plugin";
import type { UserConfig } from "vite";
import { createViteVanillaExtractSprinklesExtractor } from "@box-extractor/vanilla-extract/vite-plugin";

const config: UserConfig = {
    plugins: [
        createViteVanillaExtractSprinklesExtractor({
            components: ["Box"],
            functions: ["themeSprinkles"],
            vanillaExtractOptions: {
                forceEmitCssInSsrBuild: true,
            },
        }),
        react(),
        ssr({ includeAssetsImportedByServer: true }),
    ],
};

export default config;
```

## TODO

this is a WIP, even tho most features are done, there are some TODO's. some things that are missing:

-   autodetection of wrapping functions (just like I did for components)
-   tsup/esbuild example (the esbuild plugins are ready today: `createEsbuildBoxExtractor` / `createEsbuildVanillaExtractSprinklesExtractor`)
