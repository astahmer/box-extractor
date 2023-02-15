# @box-extractor/vanilla-extract

## 0.2.8

### Patch Changes

-   Updated dependencies [[`0265aea`](https://github.com/astahmer/box-extractor/commit/0265aeabc590aed8837107739d9fdb9b51d40e34), [`b7b72ac`](https://github.com/astahmer/box-extractor/commit/b7b72ac0ba5bdad5fb920e87e036d2571f6894f0), [`1f897a5`](https://github.com/astahmer/box-extractor/commit/1f897a5463ade29e8680fecaff4c0eee2823a739)]:
    -   @box-extractor/core@0.5.0
    -   @box-extractor/logger@0.1.0

## 0.2.7

### Patch Changes

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`9660e84`](https://github.com/astahmer/box-extractor/commit/9660e8448365589141ac317cad59c4fc9071d516) Thanks [@astahmer](https://github.com/astahmer)! - refactor(core/finder): spread detection
    fix(core/finder): onFound callback
    fix(ve): re-use same components object so finder can add some
    test(core/finder): add real-world usage
    feat(core): castAsExtractableMap

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`ec1a0e0`](https://github.com/astahmer/box-extractor/commit/ec1a0e04adee11ffdab8d56ed9d4ea4d041f3174) Thanks [@astahmer](https://github.com/astahmer)! - build: add vite v4 to peerDeps

-   [#29](https://github.com/astahmer/box-extractor/pull/29) [`f0728ca`](https://github.com/astahmer/box-extractor/commit/f0728ca0eb1b3332ce7218584497e9bb2a6f5cdf) Thanks [@astahmer](https://github.com/astahmer)! - fix(#10): VE - filter used conditionNames

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`149af44`](https://github.com/astahmer/box-extractor/commit/149af44c09d12c54b5868afef60ae2388e4a4478) Thanks [@astahmer](https://github.com/astahmer)! - feat(core/vite): expose cacheMap
    feat(core/finder/vite): expose transform args.id onFound
    fix(ve/vite): invalidate on new transitives found

-   [`dbcde43`](https://github.com/astahmer/box-extractor/commit/dbcde43a64b74192fc524bb29229084087445fb2) Thanks [@astahmer](https://github.com/astahmer)! - chore: tsconfig.exclude + fix ts/eslint issues
    scripts: test:ci + ci
-   Updated dependencies [[`7d8efe1`](https://github.com/astahmer/box-extractor/commit/7d8efe12db1e24a8ae8e3a88486f8a69850a6c68), [`49a07fd`](https://github.com/astahmer/box-extractor/commit/49a07fd7351d969ac0d7612e71de1754ddcb3a46), [`92ce89b`](https://github.com/astahmer/box-extractor/commit/92ce89bc4b000917725ac57a5b33c85ce866be1f), [`19252b8`](https://github.com/astahmer/box-extractor/commit/19252b8203bd125c105a5f774639f5f9c9e55b41), [`44319fc`](https://github.com/astahmer/box-extractor/commit/44319fc40010aeb4923a3baa5f4c3c0289857564), [`6a8079c`](https://github.com/astahmer/box-extractor/commit/6a8079c87b5b0c39dca50a135c3067bdd74c8427), [`62f69e7`](https://github.com/astahmer/box-extractor/commit/62f69e762dd754b50aea24ede959de123e3565af), [`50ad596`](https://github.com/astahmer/box-extractor/commit/50ad5966c73a97bfb74f4e7075a25d4140de1fff), [`10384c5`](https://github.com/astahmer/box-extractor/commit/10384c5d9178f69890f22763698053f243694ff8), [`9660e84`](https://github.com/astahmer/box-extractor/commit/9660e8448365589141ac317cad59c4fc9071d516), [`cea4cab`](https://github.com/astahmer/box-extractor/commit/cea4cabdd074e40b7fc50a0b3f0a46ad0e33d119), [`e593e53`](https://github.com/astahmer/box-extractor/commit/e593e531787c7c4f05f16cb1759635087bee379d), [`d62e585`](https://github.com/astahmer/box-extractor/commit/d62e58523db5c0cc9453bb988d9751926fa3415e), [`e27488b`](https://github.com/astahmer/box-extractor/commit/e27488b71f16da110022ff7456011cb21a94150d), [`ce94b2f`](https://github.com/astahmer/box-extractor/commit/ce94b2f6e30b152ec32836c43e6be6dac4f410ed), [`556a563`](https://github.com/astahmer/box-extractor/commit/556a563f735ec876c0db1c21f30c96123a8145f8), [`ec1a0e0`](https://github.com/astahmer/box-extractor/commit/ec1a0e04adee11ffdab8d56ed9d4ea4d041f3174), [`c94d5ee`](https://github.com/astahmer/box-extractor/commit/c94d5ee5167ced1dde23c2a2cbd8cd6edf22a49c), [`d400d5a`](https://github.com/astahmer/box-extractor/commit/d400d5a0f0c19dbad9ec636712a478781a1b4be2), [`89df92d`](https://github.com/astahmer/box-extractor/commit/89df92dd822cc61422a7d5ee96e0a78058582826), [`5f34be2`](https://github.com/astahmer/box-extractor/commit/5f34be2f412758cbba86323162614b9409ba68b2), [`95e8000`](https://github.com/astahmer/box-extractor/commit/95e800000032370f05c42b5347f05d2a961c9776), [`149af44`](https://github.com/astahmer/box-extractor/commit/149af44c09d12c54b5868afef60ae2388e4a4478), [`1982332`](https://github.com/astahmer/box-extractor/commit/19823324a97a3ac597732ec3e7ec477a9bcb8202), [`4b57fd0`](https://github.com/astahmer/box-extractor/commit/4b57fd0319d0dfd5aac84f3fc035a76de23916d9), [`49168fa`](https://github.com/astahmer/box-extractor/commit/49168fa732abfb22727c1aab45f9076e5c4bac51), [`dbcde43`](https://github.com/astahmer/box-extractor/commit/dbcde43a64b74192fc524bb29229084087445fb2), [`3a73ebb`](https://github.com/astahmer/box-extractor/commit/3a73ebbf1f50ecd147b6b70e3c25762349bb37c0), [`e891cf1`](https://github.com/astahmer/box-extractor/commit/e891cf1ee1463ba3222af72c3aec26f491fc8da6)]:
    -   @box-extractor/core@0.4.0

## 0.2.6

### Patch Changes

-   [`03c495a`](https://github.com/astahmer/box-extractor/commit/03c495a075ff30088b4a0d6d9b7c4ba92fee2153) Thanks [@astahmer](https://github.com/astahmer)! - fix: deleted lines after rebase oops

    ```ts
    config = resolvedConfig;
    ```

    was missing, so `getAbsoluteFileId` was wrong and therefore the HMR could not work anymore since the `invalidate` weren't happening since no modules were found here

    ```ts
    const maybeModule = moduleGraph.getModuleById(getAbsoluteFileId(modPath));
    ```

## 0.2.5

### Patch Changes

-   [`b58c58c`](https://github.com/astahmer/box-extractor/commit/b58c58c34096ed5fb436e87c8d493c763b685595) Thanks [@astahmer](https://github.com/astahmer)! - fix: add missing imports after rebase

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
