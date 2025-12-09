import antfu from "@antfu/eslint-config";
import prettierConfig from "eslint-config-prettier";

export default antfu(
  {
    react: false,
    typescript: true,
    stylistic: false,
    markdown: false,
    ignores: [
      "coverage/**",
      "node_modules/**",
      "eslint-plugin-import-boundaries.js",
      "eslint-plugin-import-boundaries.d.ts",
    ],
    languageOptions: {
      globals: {
        describe: true,
        it: true,
        expect: true,
        vi: true,
        beforeAll: true,
        beforeEach: true,
        afterEach: true,
        afterAll: true,
      },
    },
    rules: {
      "no-console": ["error", { allow: ["error"] }],
      "import/no-duplicates": ["error", { "prefer-inline": false }],
    },
  },
  {
    ignores: [
      "pnpm-lock.yaml",
      "node_modules/**",
      "coverage/**",
      "*.yml",
      "**/*.md",
      "**/*.mdx",
      "eslint-plugin-import-boundaries.js",
      "eslint-plugin-import-boundaries.d.ts",
    ],
  },
  prettierConfig,
);
