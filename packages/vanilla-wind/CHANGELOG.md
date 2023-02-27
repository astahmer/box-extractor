# @box-extractor/vanilla-wind

## 0.3.5

### Patch Changes

-   Updated dependencies [[`e2057f2`](https://github.com/astahmer/box-extractor/commit/e2057f2b56c8d33cf444bd899d15108ea17f8057)]:
    -   @box-extractor/core@0.7.4

## 0.3.4

### Patch Changes

-   Updated dependencies [[`762d285`](https://github.com/astahmer/box-extractor/commit/762d285e6aa98d32a4a788b739682b475949ccd2), [`73c3b25`](https://github.com/astahmer/box-extractor/commit/73c3b2551dd322a000a2e5ef50d151bc4787768f)]:
    -   @box-extractor/core@0.7.3

## 0.3.3

### Patch Changes

-   Updated dependencies [[`4d84389`](https://github.com/astahmer/box-extractor/commit/4d843896f2a20de66f4bec5b7d3f4828c6337f9b)]:
    -   @box-extractor/core@0.7.2

## 0.3.2

### Patch Changes

-   Updated dependencies [[`dda111d`](https://github.com/astahmer/box-extractor/commit/dda111d96997241f7c3b2331759123883baa61c5)]:
    -   @box-extractor/core@0.7.1
    -   @box-extractor/logger@0.2.1

## 0.3.1

### Patch Changes

-   [#38](https://github.com/astahmer/box-extractor/pull/38) [`cd6acab`](https://github.com/astahmer/box-extractor/commit/cd6acabe0d3ed5a2f352c436924cec5b6cb4a4f7) Thanks [@astahmer](https://github.com/astahmer)! - fix(core): skip re-extracting nested spread attribute

    -   increment count since there might be conditional so it doesn't override the whole spread prop
        chore: fix eslint warnings/errors
    -   try maybeBoxNode logic for spread attribute first
    -   allow returning BoxNodeConditional from maybeObjectLikeBox

    refactor(core): BoxMap[prop].value no longer an Array
    it was a temporary workaround but now BoxNodeList fill that needs

    -   rm useless cast calls, early returns when possible
    -   rm maybeObjectLikeBox duplicated checks/jumps & fallback to maybeBox if object-like instead
    -   add a few logs for conditionals

    feat(core): add BoxNodeMap.spreadConditions
    fix(core): rm evaluate typeChecker usage (cost dozens/hundreds of ms) TODO add it back if using a flag

-   [#38](https://github.com/astahmer/box-extractor/pull/38) [`252ce35`](https://github.com/astahmer/box-extractor/commit/252ce35e2797c55cf80a4531edddcdf2737d71ad) Thanks [@astahmer](https://github.com/astahmer)! - renamed types:
    BoxNodesMap -> ExtractResultByName
    ComponentNodesMap -> ExtractedComponentResult
    FunctionNodesMap -> ExtractedFunctionResult
    PropNodesMap -> ExtractResultItem
    QueryComponentBox -> ExtractedComponentInstance
    QueryFnBox -> ExtractedFunctionInstance
-   Updated dependencies [[`1901c66`](https://github.com/astahmer/box-extractor/commit/1901c66526bfda479de085e9088e8fa582796bd5), [`cd6acab`](https://github.com/astahmer/box-extractor/commit/cd6acabe0d3ed5a2f352c436924cec5b6cb4a4f7), [`252ce35`](https://github.com/astahmer/box-extractor/commit/252ce35e2797c55cf80a4531edddcdf2737d71ad)]:
    -   @box-extractor/core@0.7.0

## 0.3.0

### Minor Changes

-   [#35](https://github.com/astahmer/box-extractor/pull/35) [`529b8ad`](https://github.com/astahmer/box-extractor/commit/529b8adad1272da480b97cbb45319f3b6dec7960) Thanks [@astahmer](https://github.com/astahmer)! - fix(core): identifier value from external file
    refactor(core): rm extra isNotNullish calls
    feat(vwind): dedupe rules + add logs

-   [#35](https://github.com/astahmer/box-extractor/pull/35) [`764a176`](https://github.com/astahmer/box-extractor/commit/764a176538eab6bab02948884e40c8b14a8dfeef) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): remove internal typechecker calls (through getSymbol), most of the time was due to resolving an identifier value or an import/export declaration module specificier source file

    refactor(core): always return a single BoxNode from maybeBoxNode

    feat(cli): rdeps/pdeps args & tweak compilerOptions
    chore(vwind): update snapshots

### Patch Changes

-   Updated dependencies [[`529b8ad`](https://github.com/astahmer/box-extractor/commit/529b8adad1272da480b97cbb45319f3b6dec7960), [`5ca6fef`](https://github.com/astahmer/box-extractor/commit/5ca6fef23e0c588198aaee88a72640cdaa012c3c), [`764a176`](https://github.com/astahmer/box-extractor/commit/764a176538eab6bab02948884e40c8b14a8dfeef)]:
    -   @box-extractor/core@0.6.0
    -   @box-extractor/logger@0.2.0

## 0.2.0

### Minor Changes

-   [`1f897a5`](https://github.com/astahmer/box-extractor/commit/1f897a5463ade29e8680fecaff4c0eee2823a739) Thanks [@astahmer](https://github.com/astahmer)! - chore: rm vanilla-extract adapter/plugins -> vanilla-wind
    chore: explicitly add package.json + tsconfig.json to files published
    refactor(vanilla-theme): publish as raw .ts, rm /css entrypoint & typings
    chore(examples/react-rakkas): rm baseUrl

### Patch Changes

-   Updated dependencies [[`0265aea`](https://github.com/astahmer/box-extractor/commit/0265aeabc590aed8837107739d9fdb9b51d40e34), [`b7b72ac`](https://github.com/astahmer/box-extractor/commit/b7b72ac0ba5bdad5fb920e87e036d2571f6894f0), [`1f897a5`](https://github.com/astahmer/box-extractor/commit/1f897a5463ade29e8680fecaff4c0eee2823a739)]:
    -   @box-extractor/core@0.5.0
    -   @box-extractor/logger@0.1.0

## 0.1.2

### Patch Changes

-   Updated dependencies [[`7d8efe1`](https://github.com/astahmer/box-extractor/commit/7d8efe12db1e24a8ae8e3a88486f8a69850a6c68), [`49a07fd`](https://github.com/astahmer/box-extractor/commit/49a07fd7351d969ac0d7612e71de1754ddcb3a46), [`92ce89b`](https://github.com/astahmer/box-extractor/commit/92ce89bc4b000917725ac57a5b33c85ce866be1f), [`19252b8`](https://github.com/astahmer/box-extractor/commit/19252b8203bd125c105a5f774639f5f9c9e55b41), [`44319fc`](https://github.com/astahmer/box-extractor/commit/44319fc40010aeb4923a3baa5f4c3c0289857564), [`6a8079c`](https://github.com/astahmer/box-extractor/commit/6a8079c87b5b0c39dca50a135c3067bdd74c8427), [`62f69e7`](https://github.com/astahmer/box-extractor/commit/62f69e762dd754b50aea24ede959de123e3565af), [`50ad596`](https://github.com/astahmer/box-extractor/commit/50ad5966c73a97bfb74f4e7075a25d4140de1fff), [`10384c5`](https://github.com/astahmer/box-extractor/commit/10384c5d9178f69890f22763698053f243694ff8), [`9660e84`](https://github.com/astahmer/box-extractor/commit/9660e8448365589141ac317cad59c4fc9071d516), [`cea4cab`](https://github.com/astahmer/box-extractor/commit/cea4cabdd074e40b7fc50a0b3f0a46ad0e33d119), [`e593e53`](https://github.com/astahmer/box-extractor/commit/e593e531787c7c4f05f16cb1759635087bee379d), [`d62e585`](https://github.com/astahmer/box-extractor/commit/d62e58523db5c0cc9453bb988d9751926fa3415e), [`e27488b`](https://github.com/astahmer/box-extractor/commit/e27488b71f16da110022ff7456011cb21a94150d), [`ce94b2f`](https://github.com/astahmer/box-extractor/commit/ce94b2f6e30b152ec32836c43e6be6dac4f410ed), [`556a563`](https://github.com/astahmer/box-extractor/commit/556a563f735ec876c0db1c21f30c96123a8145f8), [`ec1a0e0`](https://github.com/astahmer/box-extractor/commit/ec1a0e04adee11ffdab8d56ed9d4ea4d041f3174), [`c94d5ee`](https://github.com/astahmer/box-extractor/commit/c94d5ee5167ced1dde23c2a2cbd8cd6edf22a49c), [`d400d5a`](https://github.com/astahmer/box-extractor/commit/d400d5a0f0c19dbad9ec636712a478781a1b4be2), [`89df92d`](https://github.com/astahmer/box-extractor/commit/89df92dd822cc61422a7d5ee96e0a78058582826), [`5f34be2`](https://github.com/astahmer/box-extractor/commit/5f34be2f412758cbba86323162614b9409ba68b2), [`95e8000`](https://github.com/astahmer/box-extractor/commit/95e800000032370f05c42b5347f05d2a961c9776), [`149af44`](https://github.com/astahmer/box-extractor/commit/149af44c09d12c54b5868afef60ae2388e4a4478), [`1982332`](https://github.com/astahmer/box-extractor/commit/19823324a97a3ac597732ec3e7ec477a9bcb8202), [`4b57fd0`](https://github.com/astahmer/box-extractor/commit/4b57fd0319d0dfd5aac84f3fc035a76de23916d9), [`49168fa`](https://github.com/astahmer/box-extractor/commit/49168fa732abfb22727c1aab45f9076e5c4bac51), [`dbcde43`](https://github.com/astahmer/box-extractor/commit/dbcde43a64b74192fc524bb29229084087445fb2), [`3a73ebb`](https://github.com/astahmer/box-extractor/commit/3a73ebbf1f50ecd147b6b70e3c25762349bb37c0), [`e891cf1`](https://github.com/astahmer/box-extractor/commit/e891cf1ee1463ba3222af72c3aec26f491fc8da6)]:
    -   @box-extractor/core@0.4.0
