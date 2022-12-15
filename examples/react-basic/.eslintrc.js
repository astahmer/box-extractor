// @ts-check
const { defineConfig } = require("eslint-define-config");

module.exports = defineConfig({
    extends: ["@astahmer/eslint-config-react", "../../.eslintrc.js"],
    parserOptions: {
        project: ["./tsconfig.json"],
    },
});
