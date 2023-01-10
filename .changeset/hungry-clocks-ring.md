---
"@box-extractor/vanilla-extract": patch
---

fix: deleted lines after rebase oops

```ts
config = resolvedConfig;
```

was missing, so `getAbsoluteFileId` was wrong and therefore the HMR could not work anymore since the `invalidate` weren't happening since no modules were found here

```ts
const maybeModule = moduleGraph.getModuleById(getAbsoluteFileId(modPath));
```
