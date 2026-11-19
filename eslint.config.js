import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import { reactRefresh } from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

export default defineConfig(
  globalIgnores([
    ".superpowers/",
    "coverage/",
    "dist/",
    "dist-ssr/",
    "playwright-report/",
    "test-results/",
    "**/vite.config.*.timestamp-*.mjs",
  ]),
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    linterOptions: { reportUnusedDisableDirectives: "error" },
    rules: {
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true, reportUsedIgnorePattern: true },
      ],
    },
  },
  {
    files: ["src/**/*.{js,jsx}", "e2e/**/*.{js,jsx}"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["src/**/*.jsx"],
    ignores: ["**/*.test.jsx"],
    extends: [reactRefresh.configs.vite()],
  },
  {
    files: [
      "eslint.config.js",
      "**/*.config.{js,mjs}",
      "e2e/**/*.{js,jsx}",
      "src/test/{synthetic-env,unit-network-guard}.js",
    ],
    languageOptions: { globals: globals.nodeBuiltin },
  },
  {
    files: ["src/**/*.test.{js,jsx}", "src/test/setup.js"],
    languageOptions: {
      globals: { ...globals.nodeBuiltin, ...globals.vitest },
    },
  },
);
