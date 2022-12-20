import fs from "node:fs/promises";
import path from "node:path";

const forkDir = "ve-fork-tgz";

// eslint-disable-next-line @typescript-eslint/no-floating-promises, unicorn/prefer-top-level-await
(async () => {
    const sourceDir = path.join(__dirname, "../", forkDir);
    const packageDir = process.env["INIT_CWD"];

    if (!packageDir) {
        throw new Error("No INIT_CWD specified");
    }

    for (const tgzFile of await fs.readdir(sourceDir)) {
        const tgzPath = path.join(sourceDir, tgzFile);

        await fs.mkdir(path.join(packageDir, forkDir), { recursive: true });
        await fs.copyFile(tgzPath, path.join(packageDir, forkDir, tgzFile));
    }
})();
