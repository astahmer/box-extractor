// @ts-check
const { defineConfig } = require("eslint-define-config");

module.exports = defineConfig({
    extends: ["../../.eslintrc.js"],
    parserOptions: {
        project: ["./tsconfig.json"],
    },
    overrides: [
        {
            files: ["src/index.ts"],
            rules: {
                "import/no-unused-modules": 0,
            },
        },
    ],
});
