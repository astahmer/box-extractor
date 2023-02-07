// import { normalizePath } from "vite";
// TODO add it back to normalizeTsx

export const tsConfigFilePath = "tsconfig.json";
export const virtualExtCss = ".jit.css";

export const normalizeTsx = (id: string) => (id.endsWith(".tsx") ? id : id + ".tsx");
export const hasStyledFn = (code: string, styledFn: string) => code.includes(`${styledFn}(`);
export const hasStyledComponent = (code: string, styledComponent: string) => code.includes(`<${styledComponent}`);
export const hasStyledType = (code: string, styledFn: string) => code.includes(`WithStyledProps<typeof ${styledFn}>`);
export const hasAnyStyled = (code: string, name: string) =>
    hasStyledFn(code, name) || hasStyledComponent(code, name) || hasStyledType(code, name);
