import { isAbsolute, resolve } from "node:path";

export const tsRE = /\.tsx?$/;
export const defaultIsExtractableFile = (id: string) => tsRE.test(id);

export type AllowedExtensionOptions = {
    // TODO just use regex above
    isExtractableFile?: (id: string) => boolean;
};

export const ensureAbsolute = (path: string, root: string) =>
    path ? (isAbsolute(path) ? path : resolve(root, path)) : root;
