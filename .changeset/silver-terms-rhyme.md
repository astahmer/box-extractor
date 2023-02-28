---
"@box-extractor/core": patch
---

opti(core): smarter condition resolving
try to resolve cond identfier or fallback to evaluating it, then reduce ternary based on the condition truthy/falsy value

feat(core): extract null/undefined on JsxSpreadAttribute
