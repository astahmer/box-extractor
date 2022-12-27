---
"@box-extractor/core": patch
---

feat(core): add debug logs + rollup file filter
feat(core): use cacheMap + fast check with includes
to avoid AST-parsing when not needed (300ms gain x2 on small demo)
