const baseUrl =
    "https://github.com/astahmer/box-extractor/raw/main/packages/vanilla-extract/ve-fork-tgz/vanilla-extract-";

function readPackage(pkg, context) {
    // Override the manifest of @box-extractor/vanilla-extract" after downloading it from the registry
    if (pkg.name === "@box-extractor/vanilla-extract") {
        context.log("[@box-extractor/vanilla-extract]: Replacing link: with git: dependencies");
        Object.entries(pkg.dependencies).forEach(([key, value]) => {
            if (value.includes("link:")) {
                const packageName = key.split("/").pop();
                pkg.dependencies[key] = baseUrl + packageName + ".tgz";
                context.log(`[${key}]: Replaced with ${pkg.dependencies[key]}}`);
            }
        });
    }

    if (pkg.name === "@vanilla-extract/vite-plugin" || pkg.name === "@vanilla-extract/esbuild-plugin") {
        context.log(`[${pkg.name}]: Replacing @vanilla-extract/integration with local version`);

        pkg.dependencies["@vanilla-extract/integration"] = baseUrl + "integration.tgz";
    }

    return pkg;
}

module.exports = {
    hooks: {
        // readPackage,
    },
};
