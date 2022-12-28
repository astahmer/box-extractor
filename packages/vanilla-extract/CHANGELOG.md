# @box-extractor/vanilla-extract

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
