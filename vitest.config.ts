import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    watch: false,
    // Run test files in eslint-plugin-import-boundaries directory
    include: ["eslint-plugin-import-boundaries/**/*.test.{js,ts}"],
    // Exclude build output and node_modules
    exclude: ["dist/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      include: ["eslint-plugin-import-boundaries/**/*.ts"],
      exclude: [
        "eslint-plugin-import-boundaries/**/*.test.ts",
        "eslint-plugin-import-boundaries/**/*.js", // Compiled output
        "eslint-plugin-import-boundaries/**/types.ts", // Type definitions only
        "eslint-plugin-import-boundaries/**/defaults.ts", // Helper functions (optional)
        "tsdown.config.ts",
        "vitest.config.ts",
      ],
    },
  },
});
