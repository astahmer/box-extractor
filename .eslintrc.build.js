// @ts-check
const { defineConfig } = require("eslint-define-config");

module.exports = defineConfig({
    parserOptions: {
        files: ["*.ts"],
        project: ["./tsconfig.json"],
    },
    extends: "@astahmer/eslint-config-ts",
    ignorePatterns: ["**/*.test.ts", "*.typegen.ts"],
    settings: {
        "import/extensions": [".ts"],
    },
    rules: {
        // "file-progress/activate": 1
        "unicorn/prefer-module": 0,
        "sonarjs/cognitive-complexity": ["warn", 60],
        "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
        "@typescript-eslint/prefer-string-starts-ends-with": "off",
    },
});
