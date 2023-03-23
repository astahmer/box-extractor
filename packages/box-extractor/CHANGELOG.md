# @box-extractor/core

## 0.8.4

### Patch Changes

-   [`1f5319c`](https://github.com/astahmer/box-extractor/commit/1f5319c57249f085a516e5ae39bb3402e1e95bf3) Thanks [@astahmer](https://github.com/astahmer)! - fix(core): handle multiline literal values

## 0.8.3

### Patch Changes

-   [`aa52972`](https://github.com/astahmer/box-extractor/commit/aa5297219632792c8a2e8facee9cc5df3d297a8f) Thanks [@astahmer](https://github.com/astahmer)! - fix: rm spread prop when unresolvable + rm unbox symbols

## 0.8.2

### Patch Changes

-   [`dd5f130`](https://github.com/astahmer/box-extractor/commit/dd5f130f913398ac3ff47967ce1dcba8daec1906) Thanks [@astahmer](https://github.com/astahmer)! - refactor: rm tsquery from core + vanilla-wind

-   [`3da520c`](https://github.com/astahmer/box-extractor/commit/3da520c5ce3e6f1ffb679420dc48c567ae99f104) Thanks [@astahmer](https://github.com/astahmer)! - fix(core): unbox keep unresolvable/conditional with symbols

## 0.8.1

### Patch Changes

-   [#47](https://github.com/astahmer/box-extractor/pull/47) [`21e61bf`](https://github.com/astahmer/box-extractor/commit/21e61bf69ad727355e43d037c1ee3d62d245daff) Thanks [@astahmer](https://github.com/astahmer)! - refactor: always return a BoxNodeList from extractCallExpressionValues

    feat: functions.matchArg

    rename: extractCallExpressionValues -> extractCallExpressionArguments

-   [#47](https://github.com/astahmer/box-extractor/pull/47) [`10ffcb0`](https://github.com/astahmer/box-extractor/commit/10ffcb03129698fcbdfffe9a37eb6fcc251654c1) Thanks [@astahmer](https://github.com/astahmer)! - feat: add BoxContext with flags + eval callbacks

-   [#47](https://github.com/astahmer/box-extractor/pull/47) [`8cac8be`](https://github.com/astahmer/box-extractor/commit/8cac8be9af51822876d5d6e219fe0ea9243f74e6) Thanks [@astahmer](https://github.com/astahmer)! - fix: getComponentName for factories (PropertyAccessExpression)

## 0.8.0

### Minor Changes

-   [#46](https://github.com/astahmer/box-extractor/pull/46) [`cec6e1e`](https://github.com/astahmer/box-extractor/commit/cec6e1e4059d87e31b0dc5665991ea1bda12141c) Thanks [@astahmer](https://github.com/astahmer)! - refactor(core): match tag/fn/prop functions for better control on what gets extracted

    opti: forEachDescendant directly on extractable nodes rather than identifier

-   [`484db8c`](https://github.com/astahmer/box-extractor/commit/484db8c721ae5cf1f179ff4863b1c8c3b8e925b5) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): extractAtRange / extractJsxElementProps

### Patch Changes

-   [`83bfd0a`](https://github.com/astahmer/box-extractor/commit/83bfd0a8e7f271d1fd4df1985a3cd538d7ebe498) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): handle PrefixUnaryExpression.MinusToken

## 0.7.5

### Patch Changes

-   [`190a6dd`](https://github.com/astahmer/box-extractor/commit/190a6dd5ea0703cb98408e19528fc51f7b73c3c9) Thanks [@astahmer](https://github.com/astahmer)! - opti(core): smarter condition resolving
    try to resolve cond identfier or fallback to evaluating it, then reduce ternary based on the condition truthy/falsy value

    feat(core): extract null/undefined on JsxSpreadAttribute

## 0.7.4

### Patch Changes

-   [`e2057f2`](https://github.com/astahmer/box-extractor/commit/e2057f2b56c8d33cf444bd899d15108ea17f8057) Thanks [@astahmer](https://github.com/astahmer)! - opti(core): skip CallExpression eval if declaration but no initializer

## 0.7.3

### Patch Changes

-   [`762d285`](https://github.com/astahmer/box-extractor/commit/762d285e6aa98d32a4a788b739682b475949ccd2) Thanks [@astahmer](https://github.com/astahmer)! - fix(core): getLiteralValue instead of text for Numeric/Boolean

-   [`73c3b25`](https://github.com/astahmer/box-extractor/commit/73c3b2551dd322a000a2e5ef50d151bc4787768f) Thanks [@astahmer](https://github.com/astahmer)! - opti(core): skip CallExpression eval if unresolvable identifier

## 0.7.2

### Patch Changes

-   [`4d84389`](https://github.com/astahmer/box-extractor/commit/4d843896f2a20de66f4bec5b7d3f4828c6337f9b) Thanks [@astahmer](https://github.com/astahmer)! - fix(core): pass allowed properties down to maybeObjectLikeBox, from spread / call expression extraction

## 0.7.1

### Patch Changes

-   [`dda111d`](https://github.com/astahmer/box-extractor/commit/dda111d96997241f7c3b2331759123883baa61c5) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): rm 2 more eval calls
    only use safeEvaluate (from ts-evaluator) for ConditionalExpression && CallExpression

    fix(logger): prevent lazy logs to execute their thunk if not enabled

-   Updated dependencies [[`dda111d`](https://github.com/astahmer/box-extractor/commit/dda111d96997241f7c3b2331759123883baa61c5)]:
    -   @box-extractor/logger@0.2.1

## 0.7.0

### Minor Changes

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

### Patch Changes

-   [#38](https://github.com/astahmer/box-extractor/pull/38) [`1901c66`](https://github.com/astahmer/box-extractor/commit/1901c66526bfda479de085e9088e8fa582796bd5) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): push stack from findIdentifierValueDeclaration
    debug(core): add cache logs
    chore: use maybePropName instead of maybeStringLiteral (to allow for NumericLiteral as prop names)

-   [#38](https://github.com/astahmer/box-extractor/pull/38) [`252ce35`](https://github.com/astahmer/box-extractor/commit/252ce35e2797c55cf80a4531edddcdf2737d71ad) Thanks [@astahmer](https://github.com/astahmer)! - renamed types:
    BoxNodesMap -> ExtractResultByName
    ComponentNodesMap -> ExtractedComponentResult
    FunctionNodesMap -> ExtractedFunctionResult
    PropNodesMap -> ExtractResultItem
    QueryComponentBox -> ExtractedComponentInstance
    QueryFnBox -> ExtractedFunctionInstance

## 0.6.0

### Minor Changes

-   [#35](https://github.com/astahmer/box-extractor/pull/35) [`529b8ad`](https://github.com/astahmer/box-extractor/commit/529b8adad1272da480b97cbb45319f3b6dec7960) Thanks [@astahmer](https://github.com/astahmer)! - fix(core): identifier value from external file
    refactor(core): rm extra isNotNullish calls
    feat(vwind): dedupe rules + add logs

-   [#35](https://github.com/astahmer/box-extractor/pull/35) [`5ca6fef`](https://github.com/astahmer/box-extractor/commit/5ca6fef23e0c588198aaee88a72640cdaa012c3c) Thanks [@astahmer](https://github.com/astahmer)! - fix(core): external identifier reference value with better perf
    fix(examples/react-basic): re-add vanilla-extract/css since vite HMR crash without it (?)

-   [#35](https://github.com/astahmer/box-extractor/pull/35) [`764a176`](https://github.com/astahmer/box-extractor/commit/764a176538eab6bab02948884e40c8b14a8dfeef) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): remove internal typechecker calls (through getSymbol), most of the time was due to resolving an identifier value or an import/export declaration module specificier source file

    refactor(core): always return a single BoxNode from maybeBoxNode

    feat(cli): rdeps/pdeps args & tweak compilerOptions
    chore(vwind): update snapshots

### Patch Changes

-   Updated dependencies [[`529b8ad`](https://github.com/astahmer/box-extractor/commit/529b8adad1272da480b97cbb45319f3b6dec7960)]:
    -   @box-extractor/logger@0.2.0

## 0.5.0

### Minor Changes

-   [`1f897a5`](https://github.com/astahmer/box-extractor/commit/1f897a5463ade29e8680fecaff4c0eee2823a739) Thanks [@astahmer](https://github.com/astahmer)! - chore: rm vanilla-extract adapter/plugins -> vanilla-wind
    chore: explicitly add package.json + tsconfig.json to files published
    refactor(vanilla-theme): publish as raw .ts, rm /css entrypoint & typings
    chore(examples/react-rakkas): rm baseUrl

### Patch Changes

-   [`0265aea`](https://github.com/astahmer/box-extractor/commit/0265aeabc590aed8837107739d9fdb9b51d40e34) Thanks [@astahmer](https://github.com/astahmer)! - fix(core): add guard on extractFunctionFrom queryList

-   [`b7b72ac`](https://github.com/astahmer/box-extractor/commit/b7b72ac0ba5bdad5fb920e87e036d2571f6894f0) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): add cache where it was missing

-   Updated dependencies [[`1f897a5`](https://github.com/astahmer/box-extractor/commit/1f897a5463ade29e8680fecaff4c0eee2823a739)]:
    -   @box-extractor/logger@0.1.0

## 0.4.0

### Minor Changes

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`7d8efe1`](https://github.com/astahmer/box-extractor/commit/7d8efe12db1e24a8ae8e3a88486f8a69850a6c68) Thanks [@astahmer](https://github.com/astahmer)! - refactor(core): use classes + add BoxNode.stack

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`62f69e7`](https://github.com/astahmer/box-extractor/commit/62f69e762dd754b50aea24ede959de123e3565af) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): extract readonly TypeLiteral (for .d.ts files)

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`50ad596`](https://github.com/astahmer/box-extractor/commit/50ad5966c73a97bfb74f4e7075a25d4140de1fff) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): extract undefined + use unresolvable rather than emptyObject when appropriate + return unresolvable in extractCallExpression

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`d400d5a`](https://github.com/astahmer/box-extractor/commit/d400d5a0f0c19dbad9ec636712a478781a1b4be2) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): expose more methods

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`3a73ebb`](https://github.com/astahmer/box-extractor/commit/3a73ebbf1f50ecd147b6b70e3c25762349bb37c0) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): extract all CallExpression arguments

### Patch Changes

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`49a07fd`](https://github.com/astahmer/box-extractor/commit/49a07fd7351d969ac0d7612e71de1754ddcb3a46) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): FunctionNodesMap.queryList + exports

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`92ce89b`](https://github.com/astahmer/box-extractor/commit/92ce89bc4b000917725ac57a5b33c85ce866be1f) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): extract PropertyAccessExpression component names

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`19252b8`](https://github.com/astahmer/box-extractor/commit/19252b8203bd125c105a5f774639f5f9c9e55b41) Thanks [@astahmer](https://github.com/astahmer)! - build: use autogenerated preconstruct.exports
    use preconstruct.exports = true & browser/worker for core + run preconstruct fix

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`44319fc`](https://github.com/astahmer/box-extractor/commit/44319fc40010aeb4923a3baa5f4c3c0289857564) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): extractFunctionFrom, isImportedFrom

-   [#32](https://github.com/astahmer/box-extractor/pull/32) [`6a8079c`](https://github.com/astahmer/box-extractor/commit/6a8079c87b5b0c39dca50a135c3067bdd74c8427) Thanks [@astahmer](https://github.com/astahmer)! - refactor(core): getNode always return a singular value

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`10384c5`](https://github.com/astahmer/box-extractor/commit/10384c5d9178f69890f22763698053f243694ff8) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): BindingElement > ArrayBindingPattern

    -   fix box.cast, make it recursive & simplify 1 sized arr

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`9660e84`](https://github.com/astahmer/box-extractor/commit/9660e8448365589141ac317cad59c4fc9071d516) Thanks [@astahmer](https://github.com/astahmer)! - refactor(core/finder): spread detection
    fix(core/finder): onFound callback
    fix(ve): re-use same components object so finder can add some
    test(core/finder): add real-world usage
    feat(core): castAsExtractableMap

-   [#31](https://github.com/astahmer/box-extractor/pull/31) [`cea4cab`](https://github.com/astahmer/box-extractor/commit/cea4cabdd074e40b7fc50a0b3f0a46ad0e33d119) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): extract JsxAttribute without initializer

-   [#32](https://github.com/astahmer/box-extractor/pull/32) [`e593e53`](https://github.com/astahmer/box-extractor/commit/e593e531787c7c4f05f16cb1759635087bee379d) Thanks [@astahmer](https://github.com/astahmer)! - refactor(core): keep conditional as is / rm narrowCondionalType
    refactor(core): rm literal array value

-   [#32](https://github.com/astahmer/box-extractor/pull/32) [`d62e585`](https://github.com/astahmer/box-extractor/commit/d62e58523db5c0cc9453bb988d9751926fa3415e) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): BoxNode.LiteralType.kind
    fix(core): keep boolean type

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`e27488b`](https://github.com/astahmer/box-extractor/commit/e27488b71f16da110022ff7456011cb21a94150d) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): extract NullKeyword

-   [#32](https://github.com/astahmer/box-extractor/pull/32) [`ce94b2f`](https://github.com/astahmer/box-extractor/commit/ce94b2f6e30b152ec32836c43e6be6dac4f410ed) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): add ConditionalType.kind

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`556a563`](https://github.com/astahmer/box-extractor/commit/556a563f735ec876c0db1c21f30c96123a8145f8) Thanks [@astahmer](https://github.com/astahmer)! - refactor(core): make extractMap optional

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`ec1a0e0`](https://github.com/astahmer/box-extractor/commit/ec1a0e04adee11ffdab8d56ed9d4ea4d041f3174) Thanks [@astahmer](https://github.com/astahmer)! - build: add vite v4 to peerDeps

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`c94d5ee`](https://github.com/astahmer/box-extractor/commit/c94d5ee5167ced1dde23c2a2cbd8cd6edf22a49c) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): expose isBoxNode

-   [`89df92d`](https://github.com/astahmer/box-extractor/commit/89df92dd822cc61422a7d5ee96e0a78058582826) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): support boolean extraction

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`5f34be2`](https://github.com/astahmer/box-extractor/commit/5f34be2f412758cbba86323162614b9409ba68b2) Thanks [@astahmer](https://github.com/astahmer)! - fix(core): find-prop > StringLiteral > add checks for the name
    fix(core): TemplateSpan > getLiteral + add it

    & add TODOs

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`95e8000`](https://github.com/astahmer/box-extractor/commit/95e800000032370f05c42b5347f05d2a961c9776) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): ElementAccessExpression > PropertyAccessExpression

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`149af44`](https://github.com/astahmer/box-extractor/commit/149af44c09d12c54b5868afef60ae2388e4a4478) Thanks [@astahmer](https://github.com/astahmer)! - feat(core/vite): expose cacheMap
    feat(core/finder/vite): expose transform args.id onFound
    fix(ve/vite): invalidate on new transitives found

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`1982332`](https://github.com/astahmer/box-extractor/commit/19823324a97a3ac597732ec3e7ec477a9bcb8202) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): add fromNode to get the queried ts.node

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`4b57fd0`](https://github.com/astahmer/box-extractor/commit/4b57fd0319d0dfd5aac84f3fc035a76de23916d9) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): allow replacing ts-evaluator env.preset

-   [`49168fa`](https://github.com/astahmer/box-extractor/commit/49168fa732abfb22727c1aab45f9076e5c4bac51) Thanks [@astahmer](https://github.com/astahmer)! - refactor: rm NodeObjectLiteralExpressionType

-   [`dbcde43`](https://github.com/astahmer/box-extractor/commit/dbcde43a64b74192fc524bb29229084087445fb2) Thanks [@astahmer](https://github.com/astahmer)! - chore: tsconfig.exclude + fix ts/eslint issues
    scripts: test:ci + ci

-   [#33](https://github.com/astahmer/box-extractor/pull/33) [`e891cf1`](https://github.com/astahmer/box-extractor/commit/e891cf1ee1463ba3222af72c3aec26f491fc8da6) Thanks [@astahmer](https://github.com/astahmer)! - feat(core): unbox - getBoxLiteralValue using visitBoxNode

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
