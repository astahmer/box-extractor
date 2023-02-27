---
"@box-extractor/core": patch
"@box-extractor/logger": patch
---

feat(core): rm 2 more eval calls
only use safeEvaluate (from ts-evaluator) for ConditionalExpression && CallExpression

fix(logger): prevent lazy logs to execute their thunk if not enabled
