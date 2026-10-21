const path = require("node:path");

const { transformIgnorePatterns } = require("jest-expo/jest-preset");

const reactDir = path.dirname(require.resolve("react/package.json"));

/**
 * Bun's isolated installs keep packages under
 * `node_modules/.bun/<name>@<version>/node_modules`, like pnpm's `.pnpm`
 * store, so the preset's transform allow-list must look past that prefix. It
 * also lists the ESM-only packages the app adds (FlashList).
 *
 * Workspace sources (`packages/core`) are transpiled with the app's Babel,
 * whose helpers (`@babel/runtime`) only the app has: like Metro's
 * `nodeModulesPaths`, unresolved modules fall back to the app's folder.
 * React maps to the app's copy: Jest resolves from each file's real path, so
 * `packages/core` would load its own dev copy and every hook in it would
 * throw "Invalid hook call" (Metro already bundles one copy). `expo-audio` is replaced at the
 * module boundary by a scriptable fake engine (`src/test/expo-audio.ts`).
 *
 * @type {import("jest").Config}
 */
module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: transformIgnorePatterns.map((pattern) =>
    pattern.replace("(.pnpm|", "(.pnpm|.bun|@shopify/flash-list|"),
  ),
  clearMocks: true,
  modulePaths: ["<rootDir>/node_modules"],
  moduleNameMapper: {
    "^react$": reactDir,
    "^react/(.*)$": `${reactDir}/$1`,
    "^expo-audio$": "<rootDir>/src/test/expo-audio.ts",
    "\\.css$": "<rootDir>/src/test/stylesheet.ts",
  },
  setupFiles: ["<rootDir>/src/test/setup.ts"],
};
