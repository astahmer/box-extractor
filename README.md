# box-extractor

-   this CANT work without [this PR to VE](https://github.com/vanilla-extract-css/vanilla-extract/pull/942)

in the meantime, you can still use it but it needs extra steps:

-   before adding the `@box-extractor/vanilla-extract` dep, add this `.pnpmfile.cjs` in your package root (next to your `pnpm-lock.yaml`)

```js
const baseUrl =
    "https://github.com/astahmer/box-extractor/raw/main/packages/vanilla-extract/ve-fork-tgz/vanilla-extract-";

function readPackage(pkg, context) {
    // Override the manifest of @box-extractor/vanilla-extract" after downloading it from the registry
    if (pkg.name === "@box-extractor/vanilla-extract") {
        context.log("[tmp]: Replacing @box-extractor/vanilla-extract file dependencies");

        Object.entries(pkg.dependencies).forEach(([key, value]) => {
            if (value.includes("link:")) {
                const packageName = key.split("/").pop();
                pkg.dependencies[key] = baseUrl + packageName + ".tgz";

                context.log(`[tmp]: Replaced ${key} dependency with ${pkg.dependencies[key]}}`);
            }
        });
    }

    return pkg;
}

module.exports = {
    hooks: {
        readPackage,
    },
};
```

this replace the file dependencies (which are forked vanilla-extract packages) of `@box-extractor/vanilla-extract` (`file:xxx`) [by the forks included in `box-extractor repo as .tgz](https://github.com/astahmer/box-extractor/raw/main/packages/vanilla-extract/ve-fork-tgz/) BEFORE the installation process happens

-   atm it doesn't work with vite 4 (since [VE doesn't support it yet](https://github.com/vanilla-extract-css/vanilla-extract/issues/945) and I tested the plugin while on v3 only)
-   atm it doesn't work with typescript 4.9+ (since our version of tsmorph doesn't support it yet, I'll update it at some point, not prio)

https://twitter.com/astahmer_dev/status/1601244606133567488

![Screenshot 2022-12-18 at 11 35 31](https://user-images.githubusercontent.com/47224540/208293575-811808ac-db7f-4443-b977-323a9cf25ac9.png)

https://twitter.com/astahmer_dev/status/1601246126396428289

## TODO

this is a WIP, even tho most features are done, there are some TODO's. some things that are missing:

### features

-   autodetection of wrapping functions (just like I did for components)
-   extraction of values inside a non-ternary condition (`xx ?? yy`, or `xx || yy`)

### others

-   tsup/esbuild example
-   logs debug (instead of all those commented console.log)
-   changeset for versioning
-   include VE's fork (as tgz) for their packages: vite-plugin / esbuild-plugin / integration / sprinkles while waiting for the PR I made to VE https://github.com/vanilla-extract-css/vanilla-extract/pull/942 to be merged
