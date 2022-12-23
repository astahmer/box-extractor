---
"@box-extractor/vanilla-extract": patch
---

fix HMR for SSR after initial load (SSS -> CSR like nextjs) / when using export maps (re-exports in index.ts)
fix createBoxSprinklesInternal typings (for ReversedConditionsProps) after inlining VE's types (which fixed the .d.ts generated output)
