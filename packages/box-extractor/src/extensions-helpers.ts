import { isAbsolute, resolve } from "node:path";

export const tsRE = /\.tsx?$/;
export const ensureAbsolute = (path: string, root: string) =>
    path ? (isAbsolute(path) ? path : resolve(root, path)) : root;
