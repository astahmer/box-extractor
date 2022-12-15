import { isAbsolute, resolve } from "node:path";

const tsRE = /\.tsx?$/;

export const defaultIsExtractableFile = (id: string) => tsRE.test(id);

export type AllowedExtensionOptions = {
    shouldAddFileToProject?: (id: string) => boolean;
    isExtractableFile?: (id: string) => boolean;
};

export const ensureAbsolute = (path: string, root: string) =>
    path ? (isAbsolute(path) ? path : resolve(root, path)) : root;
