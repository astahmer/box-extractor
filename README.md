# [📦 box-extractor](https://github.com/astahmer/box-extractor/)

**Static code extraction. Zero-runtime CSS-in-TS `<Box />`**

Optimize your code and elevate your developer experience with compile-time optimizations from static analysis.

💎 &nbsp; Enhanced DX close to [Chakra-UI's `<Box />`](https://chakra-ui.com/docs/styled-system/style-props#pseudo) without [the](https://github.com/chakra-ui/chakra-ui/issues/4003) [runtime](https://github.com/chakra-ui/chakra-ui/issues/859) [cost](https://twitter.com/jaredpalmer/status/1271482711132254210?lang=en)

✂️ &nbsp; Smaller CSS/JS output (up to 99%) with compile-time purge just like Tailwind CSS

🎯 &nbsp; Over 180k props/values/conditions combinations, only 1 used in your app, only 1 will remain

🔍 &nbsp; Smart analyzer built-in for near instant drop-in benefits

💾 &nbsp; Low-level AST output with access to `ts-morph` `Node` objects for fine-grained control

# Installation

## core (static AST extraction)

if you need the static analysis (using [ts-morph](https://github.com/dsherret/ts-morph) on components props/functions args:

```ts
pnpm add @box-extractor/core
```

### core/vite

there are 2 plugins from `@box-extractor/core` :

-   `createViteBoxExtractor` that will statically analyze your TS(X) files & extract functions args / JSX component props values
-   `createViteBoxRefUsageFinder` will statically analyze your TS(X) files & recursively find every transitive components (the one being spread onto) used from a list of root components

```ts
import { createViteBoxExtractor, createViteBoxRefUsageFinder } from "@box-extractor/core";
```

### core/esbuild

only the `createEsbuildBoxExtractor` is made/exported atm from `@box-extractor/core`, it does the same as its vite counterpart

```ts
import { createEsbuildBoxExtractor } from "@box-extractor/core";
```

## TODO

some things that are missing:

-   tsup/esbuild example (the esbuild plugins are ready today: `createEsbuildBoxExtractor`)
-   [maybe TODO - finder - find all wrapping functions recursively, just like components](https://github.com/astahmer/box-extractor/issues/13)
