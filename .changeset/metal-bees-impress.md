---
"@box-extractor/core": minor
"@box-extractor/vanilla-wind": patch
---

fix(core): skip re-extracting nested spread attribute

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
