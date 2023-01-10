# @box-extractor/core

## 0.3.0

### Minor Changes

-   [`f366cd3`](https://github.com/astahmer/box-extractor/commit/f366cd3a3bea021a32149adcaae3173d48cb1aad) Thanks [@astahmer](https://github.com/astahmer)! - no longer restrict functions to be inside JSX for extraction + adjust ts-evaluator maxOps for better eval results

    add real-world extract+evaluator test case on project split across multiple files

### Patch Changes

-   [`015edda`](https://github.com/astahmer/box-extractor/commit/015edda092c71605c9b298938c220ab515acafc1) Thanks [@astahmer](https://github.com/astahmer)! - [fa7a0a8](https://github.com/astahmer/vite-box-extractor/commit/3e8442a6bb7d615607d316909ac40c532ae9860a): feat(core): BoxNode.ListType & more logs
    [3e8442a](https://github.com/astahmer/vite-box-extractor/commit/4d97931ecbbbd6132860c164b205d8cf710ce71c): fix(core): PropertyAssignment.NameNode.StringLiteral
    [4d97931](https://github.com/astahmer/vite-box-extractor/commit/4d97931ecbbbd6132860c164b205d8cf710ce71c): feat(core): add getNode fn to BoxNode
    allows retrieving the closest(s) ts-morph Node to the value(s) extracted

## 0.2.1

### Patch Changes

-   Updated dependencies [[`3aec0c2`](https://github.com/astahmer/box-extractor/commit/3aec0c2923078f674bb3c246afa2b511dc15df77)]:
    -   @box-extractor/logger@0.0.3

## 0.2.0

### Minor Changes

-   [#16](https://github.com/astahmer/box-extractor/pull/16) [`c0bde33`](https://github.com/astahmer/box-extractor/commit/c0bde33f5b18ad09473b03829cf426fe09c103b1) Thanks [@astahmer](https://github.com/astahmer)! - update ts version to 4.9.4

-   [#20](https://github.com/astahmer/box-extractor/pull/20) [`c78b43d`](https://github.com/astahmer/box-extractor/commit/c78b43d6ebdabb0d842a0f86620be9ced09f6e59) Thanks [@astahmer](https://github.com/astahmer)! - feat:

    -   BoxNode (AST-like objects) / getBoxLiteralValue
    -   better extraction for nested objects/conditionals, soon allowing usage of `css={{ ... }}` prop

    refactor:

    -   rm properties+conditionalProperties from ComponentUsedPropertiesStyle
    -   rm ExtractedComponentProperties/ExtractedPropPair
    -   rename UsedComponentsMap -> NodeMap
    -   rename ComponentUsedPropertiesStyle -> PropNodeMap
    -   rename ExtractedType -> BoxNode
    -   rename TypeKind -> BoxKind
    -   rename maybeLiteral -> maybeBoxNode
    -   rename maybeObjectEntries -> maybeObjectLikeBox

    chore:

    -   output BoxNode in test snapshots
    -   debug-logger

-   [#20](https://github.com/astahmer/box-extractor/pull/20) [`006126c`](https://github.com/astahmer/box-extractor/commit/006126c914ab22214e67e081032e56668feae52d) Thanks [@astahmer](https://github.com/astahmer)! - fix: ve/esbuild
    refactor: rename used -> extractMap
    feat(ve): allow passing extractMap/usedMap

### Patch Changes

-   [#20](https://github.com/astahmer/box-extractor/pull/20) [`2ed0abd`](https://github.com/astahmer/box-extractor/commit/2ed0abd950e163588568ec954e83710ebb89cff2) Thanks [@astahmer](https://github.com/astahmer)! - fix VE adapter after refactor with getUsedPropertiesFromExtractNodeMap

-   [#20](https://github.com/astahmer/box-extractor/pull/20) [`2ed0abd`](https://github.com/astahmer/box-extractor/commit/2ed0abd950e163588568ec954e83710ebb89cff2) Thanks [@astahmer](https://github.com/astahmer)! - use custom logger made from debug+diary npm packages

-   [#20](https://github.com/astahmer/box-extractor/pull/20) [`032ebd5`](https://github.com/astahmer/box-extractor/commit/032ebd5882b4d9404f70f3c82f6092e96d31699c) Thanks [@astahmer](https://github.com/astahmer)! - renamed UsedComponentMap properties -> literals & conditionalProperties -> entries, to remove the vanilla-extract specific naming

-   [#20](https://github.com/astahmer/box-extractor/pull/20) [`80ad405`](https://github.com/astahmer/box-extractor/commit/80ad405933970b3e1a30e1ff536bbf402dd334ab) Thanks [@astahmer](https://github.com/astahmer)! - support ?? || && expressions + add some values to vanilla-theme + allow ESM usage for VE's plugins

-   Updated dependencies [[`2ed0abd`](https://github.com/astahmer/box-extractor/commit/2ed0abd950e163588568ec954e83710ebb89cff2)]:
    -   @box-extractor/logger@0.0.2

## 0.1.8

### Patch Changes

-   [#14](https://github.com/astahmer/box-extractor/pull/14) [`123675d`](https://github.com/astahmer/box-extractor/commit/123675de07a5cfd3eae781f5ac028e2d2a16ef54) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): add debug logs + rollup file filter
    feat(core): use cacheMap + fast check with includes
    to avoid AST-parsing when not needed (300ms gain x2 on small demo)

## 0.1.0

### Minor Changes

-   [#5](https://github.com/astahmer/box-extractor/pull/5) [`d10e19f`](https://github.com/astahmer/box-extractor/commit/d10e19fdd496f8578ab2dc546dae1a2d5ef0fb05) Thanks [@astahmer](https://github.com/astahmer)! - refactored to multi-packages repo

### Patch Changes

-   Updated dependencies [[`d10e19f`](https://github.com/astahmer/box-extractor/commit/d10e19fdd496f8578ab2dc546dae1a2d5ef0fb05)]:
    -   @box-extractor/vanilla-extract@0.1.0
