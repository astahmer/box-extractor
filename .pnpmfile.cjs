const path = require("path");
const cwd = __dirname;
const integrationPath = path.join(cwd, "packages/vanilla-extract/ve-fork-tgz/vanilla-extract-integration.tgz");
console.log({ cwd, integrationPath });

function readPackage(pkg, context) {
    if (pkg.name === "@vanilla-extract/vite-plugin" || pkg.name === "@vanilla-extract/esbuild-plugin") {
        context.log(`[${pkg.name}]: Replacing @vanilla-extract/integration with local version`);

        pkg.dependencies["@vanilla-extract/integration"] = integrationPath;
    }

    return pkg;
}

module.exports = {
    hooks: {
        readPackage,
    },
};
