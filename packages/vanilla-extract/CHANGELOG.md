# @box-extractor/vanilla-extract

## 0.2.4

### Patch Changes

-   [`f366cd3`](https://github.com/astahmer/box-extractor/commit/f366cd3a3bea021a32149adcaae3173d48cb1aad) Thanks [@astahmer](https://github.com/astahmer)! - no longer restrict functions to be inside JSX for extraction + adjust ts-evaluator maxOps for better eval results

    add real-world extract+evaluator test case on project split across multiple files

-   [`015edda`](https://github.com/astahmer/box-extractor/commit/015edda092c71605c9b298938c220ab515acafc1) Thanks [@astahmer](https://github.com/astahmer)! - [984b474](https://github.com/astahmer/vite-box-extractor/commit/984b474b16aac249e60d24140257b90b4724565b): feat(vite): allow passing project so it can be re-used across plugins
    [e090ee7](https://github.com/astahmer/vite-box-extractor/commit/e090ee70aee1304c61890961b6e8421177db1b15): test: update snapshots
-   Updated dependencies [[`f366cd3`](https://github.com/astahmer/box-extractor/commit/f366cd3a3bea021a32149adcaae3173d48cb1aad), [`015edda`](https://github.com/astahmer/box-extractor/commit/015edda092c71605c9b298938c220ab515acafc1)]:
    -   @box-extractor/core@0.3.0

## 0.2.3

### Patch Changes

-   [`6376565`](https://github.com/astahmer/box-extractor/commit/6376565e0403a040efbd893e8ee0daa04d296b28) Thanks [@astahmer](https://github.com/astahmer)! - use git: deps instead of file:/ deps

## 0.2.1

### Patch Changes

-   Updated dependencies [[`3aec0c2`](https://github.com/astahmer/box-extractor/commit/3aec0c2923078f674bb3c246afa2b511dc15df77)]:
    -   @box-extractor/logger@0.0.3
    -   @box-extractor/core@0.2.1

## 0.2.0

### Minor Changes

-   [#16](https://github.com/astahmer/box-extractor/pull/16) [`c0bde33`](https://github.com/astahmer/box-extractor/commit/c0bde33f5b18ad09473b03829cf426fe09c103b1) Thanks [@astahmer](https://github.com/astahmer)! - update ts version to 4.9.4

-   [#20](https://github.com/astahmer/box-extractor/pull/20) [`006126c`](https://github.com/astahmer/box-extractor/commit/006126c914ab22214e67e081032e56668feae52d) Thanks [@astahmer](https://github.com/astahmer)! - fix: ve/esbuild
    refactor: rename used -> extractMap
    feat(ve): allow passing extractMap/usedMap

### Patch Changes

-   [#20](https://github.com/astahmer/box-extractor/pull/20) [`4d1baa7`](https://github.com/astahmer/box-extractor/commit/4d1baa7aff102c9fcc29ea3bad5ba072b6df8b79) Thanks [@astahmer](https://github.com/astahmer)! - feat(ve/esbuild): allow passing UsedComponentsMap
    so that we can extract in a process and pass that the used map to the next plugin instance

-   [#20](https://github.com/astahmer/box-extractor/pull/20) [`2ed0abd`](https://github.com/astahmer/box-extractor/commit/2ed0abd950e163588568ec954e83710ebb89cff2) Thanks [@astahmer](https://github.com/astahmer)! - fix VE adapter after refactor with getUsedPropertiesFromExtractNodeMap

-   [#20](https://github.com/astahmer/box-extractor/pull/20) [`2ed0abd`](https://github.com/astahmer/box-extractor/commit/2ed0abd950e163588568ec954e83710ebb89cff2) Thanks [@astahmer](https://github.com/astahmer)! - use custom logger made from debug+diary npm packages

-   [#20](https://github.com/astahmer/box-extractor/pull/20) [`032ebd5`](https://github.com/astahmer/box-extractor/commit/032ebd5882b4d9404f70f3c82f6092e96d31699c) Thanks [@astahmer](https://github.com/astahmer)! - renamed UsedComponentMap properties -> literals & conditionalProperties -> entries, to remove the vanilla-extract specific naming

-   [#20](https://github.com/astahmer/box-extractor/pull/20) [`80ad405`](https://github.com/astahmer/box-extractor/commit/80ad405933970b3e1a30e1ff536bbf402dd334ab) Thanks [@astahmer](https://github.com/astahmer)! - support ?? || && expressions + add some values to vanilla-theme + allow ESM usage for VE's plugins

-   Updated dependencies [[`c0bde33`](https://github.com/astahmer/box-extractor/commit/c0bde33f5b18ad09473b03829cf426fe09c103b1), [`2ed0abd`](https://github.com/astahmer/box-extractor/commit/2ed0abd950e163588568ec954e83710ebb89cff2), [`2ed0abd`](https://github.com/astahmer/box-extractor/commit/2ed0abd950e163588568ec954e83710ebb89cff2), [`032ebd5`](https://github.com/astahmer/box-extractor/commit/032ebd5882b4d9404f70f3c82f6092e96d31699c), [`80ad405`](https://github.com/astahmer/box-extractor/commit/80ad405933970b3e1a30e1ff536bbf402dd334ab), [`c78b43d`](https://github.com/astahmer/box-extractor/commit/c78b43d6ebdabb0d842a0f86620be9ced09f6e59), [`006126c`](https://github.com/astahmer/box-extractor/commit/006126c914ab22214e67e081032e56668feae52d)]:
    -   @box-extractor/core@0.2.0
    -   @box-extractor/logger@0.0.2

## 0.1.20

### Patch Changes

-   [#14](https://github.com/astahmer/box-extractor/pull/14) [`a59b8e8`](https://github.com/astahmer/box-extractor/commit/a59b8e8ef4380eb05bbe78ad799867632f7d0e0f) Thanks [@astahmer](https://github.com/astahmer)! - bump version to use latest @box-extractor/core with better HMR speed + add some more cache for even faster HMR

    add mappedProps option

-   Updated dependencies [[`123675d`](https://github.com/astahmer/box-extractor/commit/123675de07a5cfd3eae781f5ac028e2d2a16ef54)]:
    -   @box-extractor/core@0.1.8

## 0.1.19

### Patch Changes

-   [#6](https://github.com/astahmer/box-extractor/pull/6) [`9d99bce`](https://github.com/astahmer/box-extractor/commit/9d99bcecfa5b4549ddb7cdb9b3ea4c563a8dcf31) Thanks [@astahmer](https://github.com/astahmer)! - fix HMR for SSR after initial load (SSS -> CSR like nextjs) / when using export maps (re-exports in index.ts)
    fix createBoxSprinklesInternal typings (for ReversedConditionsProps) after inlining VE's types (which fixed the .d.ts generated output)

## 0.1.0

### Minor Changes

-   [#5](https://github.com/astahmer/box-extractor/pull/5) [`d10e19f`](https://github.com/astahmer/box-extractor/commit/d10e19fdd496f8578ab2dc546dae1a2d5ef0fb05) Thanks [@astahmer](https://github.com/astahmer)! - refactored to multi-packages repo

### Patch Changes

-   Updated dependencies [[`d10e19f`](https://github.com/astahmer/box-extractor/commit/d10e19fdd496f8578ab2dc546dae1a2d5ef0fb05)]:
    -   @box-extractor/core@0.1.0
