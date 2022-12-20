// https://pnpm.io/pnpmfile#usage

function readPackage(pkg, context) {
  // Override the manifest of @box-extractor/vanilla-extract" after downloading it from the registry
  if (pkg.name === "@box-extractor/vanilla-extract") {
    Object.entries(pkg.dependencies).forEach(([key, value]) => {
      if (value.includes("file:")) {
        delete pkg.dependencies[key];
      }
    });
  }

  context.log(
    "[tmp]: Removed file: dependencies from @box-extractor/vanilla-extract"
  );

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
