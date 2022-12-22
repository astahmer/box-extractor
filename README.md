# box-extractor

# What is this

https://twitter.com/astahmer_dev/status/1601244606133567488

![Screenshot 2022-12-18 at 11 35 31](https://user-images.githubusercontent.com/47224540/208293575-811808ac-db7f-4443-b977-323a9cf25ac9.png)

https://twitter.com/astahmer_dev/status/1601246126396428289

# Installation

## core

if you need the static analysis on components props/functions args: 
`pnpm add @box-extractor/core`

## @vanilla-extract/sprinkles adapter

if you need the `@vanilla-extract/sprinkles` adapter to remove any unused css classes and make your own <Box /> : 
`pnpm add @box-extractor/vanilla-extract`

then in your `vite.config.ts` add the plugin and list your sprinkles fn + your root component using a sprinkles fn.
a root component using a sprinkles fn could look like this: 

// Box.ts
```ts
const Box = ({ children, ...props}) => <div className={themeSprinkles(props)}>{children}</div>
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

### vite-plugin-sr

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

### features

-   autodetection of wrapping functions (just like I did for components)
-   extraction of values inside a non-ternary condition (`xx ?? yy`, or `xx || yy`)

### others

-   tsup/esbuild example
-   logs debug (instead of all those commented console.log in src)

# Caveats
-   atm it doesn't work with vite 4 (since [VE doesn't support it yet](https://github.com/vanilla-extract-css/vanilla-extract/issues/945) and I tested the plugin while on v3 only)
-   atm it doesn't work with typescript 4.9+ (since our version of tsmorph doesn't support it yet, I'll update it at some point, not prio)
-   `@box-extractor/vanilla-theme/css` entrypoint (which ships a preconfigured theme sprinkles as .css.ts) only works when using `link:/xxx` dependency in package.json, for some reasons [it's not working when installed from npm](https://twitter.com/astahmer_dev/status/1605856522583539718), not sure why yet, it MIGHT be because we include VE's fork (as tgz) for their packages: vite-plugin / esbuild-plugin / integration / sprinkles while waiting for the PR I made to VE https://github.com/vanilla-extract-css/vanilla-extract/pull/942 to be merged, needs more investigation
