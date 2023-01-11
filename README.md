# 📦 box-extractor

**Static code extraction. Zero-runtime CSS-in-TS `<Box />`**

Optimize your code and elevate your developer experience with compile-time optimizations from static analysis.

💎 &nbsp; Enhanced DX close to [Chakra-UI's `<Box />`](https://chakra-ui.com/docs/styled-system/style-props#pseudo) without [the](https://github.com/chakra-ui/chakra-ui/issues/4003) [runtime](https://github.com/chakra-ui/chakra-ui/issues/859) [cost](https://twitter.com/jaredpalmer/status/1271482711132254210?lang=en)

✂️ &nbsp; Smaller CSS/JS output (up to 99%) with compile-time purge just like Tailwind CSS

🎁 &nbsp; [Built-in](#box-extractorvanilla-theme---chakratailwind-sprinkle) preconfigured theme [sprinkles](https://vanilla-extract.style/documentation/packages/sprinkles/) with most of [Chakra-UI default theme](https://github.com/chakra-ui/chakra-ui/tree/main/packages/components/theme/src/foundations)'

🎯 &nbsp; Over 180k props/values/conditions combinations, only 1 used in your app, only 1 will remain

🔄 &nbsp; [Reversed conditions props](#reversed-conditions-props) allowing you to use multiple sprinkle properties on the same condition

🔍 &nbsp; Smart analyzer built-in for near instant drop-in benefits

💾 &nbsp; Low-level AST output with access to `ts-morph` `Node` objects for fine-grained control

🔌 &nbsp; Pluggable integration with exported primitives & hooks available at each step

---

# Installation

## [@vanilla-extract/sprinkles](https://vanilla-extract.style/documentation/packages/sprinkles/) adapter

```ts
pnpm add @box-extractor/vanilla-extract
```

then in your `vite.config.ts` add the plugin and list your sprinkles functions + your root component (those using a sprinkles function)

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

that's it ! 🎉 enjoy your optimized output.

---

> 💡 a root component using a sprinkles fn could look like this:

// Box.ts

```ts
const Box = ({ children, ...props }) => <div className={themeSprinkles(props)}>{children}</div>;
```

meaning you'll have to mention it in your `vite.config.ts`, like this:

```ts
const config: UserConfig = {
    plugins: [createViteVanillaExtractSprinklesExtractor({ components: ["Box"] })],
};
```

---

### createBoxSprinkles

`@box-extractor/vanilla-extract` also exports a custom sprinkles creator function (replacement for the default `createSprinkles` from `@vanille-extract/sprinkles`) to allow for more introspection by returning the `condtions` & `shorthands` in addition to the static `properties` property on the return of `createSprinkles`.

> This is needed for the 🔄 reversed conditions props to work properly.

#### 🔄 Reversed conditions props

It look like this:

```tsx
<Box _hover={{ fontSize: "xl", cursor: "pointer" }}>
    🔄 reversed conditions props = allowing multiple sprinkle properties on the same condition
</Box>
```

VS the original `@vanilla-extract/sprinkles` way of doing things:

```tsx
<Box fontSize={{ hover: "xl" }} cursor={{ hover: "pointer" }}>
    original repetitive conditions props
</Box>
```

> Fun fact: this was originally [a request feature](https://github.com/TheMightyPenguin/dessert-box/issues/18) I had made to `@dessert-box` and [later tried to implement](https://github.com/TheMightyPenguin/dessert-box/pull/23) but found impossible to do so with the original `createSprinkles` function. Kudos to the `rainbow-sprinkles` for the idea of making a custom sprinkles creator function.

### Temporary workaround

> While waiting [for the PR I made](https://github.com/vanilla-extract-css/vanilla-extract/pull/942) to the `vanilla-extract` repo adding callbacks necessary for the extractor plugin to purge unused css classes, a workaround is to use the [forked versions](./packages//vanilla-extract/ve-fork-tgz/) as [remote tarballs](https://pnpm.io/cli/add#install-from-remote-tarball) using a `readPackage` hook from a [`.pnpmfile.cjs`](https://pnpm.io/pnpmfile) to install the dependencies.

TL;DR:

-   copy this file below next to your `pnpm-lock.yaml`
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

You currently need to (or at least should) use a forked version of the `@vanilla-extract/css` package because of performance reasons : It takes more than 20 or 30s to `eval` (from `@vanilla-extract/vite-plugin` -> `processVanillaFile` -> `eval`) because of a HUGE regex that performs very slowly on `node_modules/xxx` paths in VE's code, which I fixed on the PR I sent.

You can do so like this:

// package.json

```json
"@vanilla-extract/css": "https://github.com/astahmer/box-extractor/raw/main/packages/vanilla-extract/ve-fork-tgz/vanilla-extract-css.tgz",
```

### Temporary workaround

Also, there's a weird bug atm with a vanilla-extract dependency (`ahocorasick`), I suppose this is due to the remote tarballs forks. You can fix it by adding this to your `vite.config.ts`:

```ts
optimizeDeps: {
    include: [
        "@vanilla-extract/css", // needed for ahocorasick when importing @box-extractor/vanilla-theme/css from node_modules
    ],
},
```

### HMR is slow(ish) with `@box-extractor/vanilla-theme`

when using [`@box-extractor/vanilla-theme`](https://github.com/astahmer/box-extractor/tree/main/packages/vanilla-theme), the time spent to evaluate (using [eval](https://www.npmjs.com/package/eval) from npm, called from `@vanilla-extract/vite-plugin` -> `processVanillaFile` -> `eval`) is around 600ms on my Mac M1 16go. the sprinkles config generates more than 170k CSS classes, which explain the slowness.

A way to optimize this would be to remove every property/conditions NOT used (extracted from `@box-extractor/core` in your codebase) so that it only evaluates what's necessary. This is completely feasible as of today using `ts-morph` AST manipulation.

But there is no way to make that work without hard-forking the official `vanilla-extract` vite plugin, by that I mean completely ditching the dependency on `@vanilla-extract/vite-plugin` and instead inline it + adapt it to fit our needs. This is because :

-   I can't make a vite plugin that would use the rollup `transform` hook, since the VE/vite-plugin uses a `compile` function from VE/integration -> which uses an esbuild child compilation directly using a filePath, so it doesn't care about the result of the `transform` hook since it retrieves the content of the file directly from the filesystem each time
-   I can't make an esbuild plugin either, even thought we can pass those (to the esbuild child compilation used by `compile` in the ve/vite-plugin), since the `esbuildOptions.plugins` are pushed AFTER `vanillaExtractTransformPlugin`, and even if it wasn't the case, the esbuild still gets the source from filesystem everytime so it wouldnt matter again

And hard-forking comes at a cost that I'd rather not pay: the maintenance cost. I would rather not carry the burden of maintaining a vite plugin that can have updates upstream (=on vanilla-extract repo) for things that may be unrelated to `@box-extractor`

## Box example

a more complex `<Box />` component could support :

-   [escape hatches](https://github.com/TheMightyPenguin/dessert-box/#escape-hatch) (inspired from `@dessert-box`) with the `__` prefix, allowing you to use styles not pre-defined in your theme sprinkles.
-   [🔄 reversed conditions props](#reversed-conditions-props) with the `_` prefix, allowing you to use multiple sprinkle properties on the same condition

it could look like this ([the one used from the examples](https://github.com/astahmer/box-extractor/blob/main/examples/react-basic/src/components/Box.tsx)) :

```ts
import type { PropsWithChildren } from "react";
import { composeClassNames, getBoxProps } from "@box-extractor/vanilla-extract";
import { ThemeSprinkles, themeSprinkles } from "@box-extractor/vanilla-theme/css";
import type { EscapeHatchProps, ReversedConditionsProps } from "@box-extractor/vanilla-theme";

const defaultElement = "div";

export const Box = <TType extends React.ElementType = typeof defaultElement>({
    children,
    as,
    className,
    style,
    ...props
}: PolymorphicComponentProps<PropsWithChildren<BoxProps>, TType>) => {
    const Component = as ?? defaultElement;
    const boxProps = getBoxProps(props, themeSprinkles);

    return (
        <Component
            {...boxProps.otherProps}
            className={composeClassNames(className, themeSprinkles(boxProps.sprinklesProps))}
            children={children}
            style={boxProps.sprinklesEscapeHatchProps}
        />
    );
};

export type BoxProps = ThemeSprinkles &
    EscapeHatchProps<ThemeSprinkles> &
    ReversedConditionsProps<typeof themeSprinkles>;

export type AsProp<TType extends React.ElementType = React.ElementType> = {
    as?: TType;
};

export type PolymorphicComponentProps<Props, TType extends React.ElementType> = Props &
    AsProp<TType> &
    Omit<React.ComponentProps<TType>, keyof AsProp | keyof Props>;
```

this allows you to do things like:

```tsx
<Box as="span" color="green.500">span predefined theme value from a sprinkles fn</Box>
<Box as={AnotherComponent} color={{ hover: "green.100" }}>`AnotherComponent` with a class from sprinkles using conditions</Box>
<Box __color="#5f9ea0">escape hatch (value not defined in sprinkles that will result in a `style={ color: "#5f9ea0" }` inlined prop</Box>
<Box _hover={{ fontSize: "xl", cursor: "pointer" }}>🔄 reversed conditions props = allowing multiple sprinkle properties on the same condition</Box>
<Box color={{ default: "blue.200", hover: "green.400" }} _hover={{ color: "red.300" }}>
    a mix of both
</Box>
```

### SSR frameworks

There is an example in the repo with [rakkas](https://github.com/astahmer/box-extractor/tree/main/examples/react-rakkas) & another with [vite-plugin-ssr](https://github.com/astahmer/box-extractor/tree/main/examples/react-vite-plugin-ssr), but the gist of it can be summarized to adding `vanillaExtractOptions: { forceEmitCssInSsrBuild: true }` like this:

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
        ssr({ includeAssetsImportedByServer: true }), // needed to work in HTML-only mode
    ],
};

export default config;
```

## core (static AST extraction)

if you need the static analysis (using [ts-morph](https://github.com/dsherret/ts-morph) + [tsquery](https://github.com/phenomnomnominal/tsquery/)) on components props/functions args:

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

## Caveats / debug

> `SprinklesError: "xxxx" is not a valid sprinkle`

your TS version might not be compatible with the one used by `@box-extractor/core` (which is used by `@box-extractor/vanilla-extract`) which itself must be compatible with the typescript version used by [`ts-morph`](https://github.com/dsherret/ts-morph). We're currently using [`ts-morph 17.0.1`](https://github.com/astahmer/box-extractor/blob/main/packages/box-extractor/package.json#L35) which itself [is using TS 4.9.4](https://github.com/dsherret/ts-morph/commit/42d811ed9a5177fc678a5bfec4923a2048124fe0).

---

if your TS version is compatible with [ours](<(https://github.com/astahmer/box-extractor/blob/main/packages/box-extractor/package.json#L35)>), then we might have removed one class that we shouldn't have, please open an issue with a minimal reproduction repository

also, if you want to try debugging yourself: logs are available through the DEBUG env var

```sh
DEBUG=box-ex:* pnpm dev
```

## TODO

some things that are missing:

-   autodetection of wrapping functions (just like I did for components)
-   tsup/esbuild example (the esbuild plugins are ready today: `createEsbuildBoxExtractor` / `createEsbuildVanillaExtractSprinklesExtractor`)
-   [escape hatch include map (components/functions)](https://github.com/astahmer/box-extractor/issues/8)
-   [VE - only invalidate .css.ts impacted by the extract change](https://github.com/astahmer/box-extractor/issues/9)
-   [VE - filter used conditions](https://github.com/astahmer/box-extractor/issues/10)
-   [maybe TODO - finder - find all sprinkles fn used (?) + find all (Box-like) components used from a sprinkles fn](https://github.com/astahmer/box-extractor/issues/12)
-   [maybe TODO - finder - find all wrapping functions recursively, just like components](https://github.com/astahmer/box-extractor/issues/13)
