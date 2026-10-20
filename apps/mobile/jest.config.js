const { transformIgnorePatterns } = require("jest-expo/jest-preset");

/**
 * Bun's isolated installs keep packages under
 * `node_modules/.bun/<name>@<version>/node_modules`, like pnpm's `.pnpm`
 * store, so the preset's transform allow-list must look past that prefix.
 *
 * @type {import("jest").Config}
 */
module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: transformIgnorePatterns.map((pattern) =>
    pattern.replace("(.pnpm|", "(.pnpm|.bun|"),
  ),
};
