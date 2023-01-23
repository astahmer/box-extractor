// eslint-disable-next-line unicorn/import-style, unicorn/prefer-node-protocol
import { isAbsolute, resolve } from "path";

export const tsRE = /\.tsx?$/;
export const ensureAbsolute = (path: string, root: string) =>
    path ? (isAbsolute(path) ? path : resolve(root, path)) : root;
