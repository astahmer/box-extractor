---
"@box-extractor/core": minor
"@box-extractor/vanilla-wind": minor
"@box-extractor/cli": minor
---

feat(core): remove internal typechecker calls (through getSymbol), most of the time was due to resolving an identifier value or an import/export declaration module specificier source file

refactor(core): always return a single BoxNode from maybeBoxNode

feat(cli): rdeps/pdeps args & tweak compilerOptions
chore(vwind): update snapshots
