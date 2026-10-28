const path = require("node:path");

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Release minification drops debug output while retaining warnings, errors and argument side effects.
config.transformer.minifierConfig.compress = {
  ...config.transformer.minifierConfig.compress,
  pure_funcs: ["console.log", "console.info", "console.debug"],
};

module.exports = withNativeWind(config, {
  input: path.join(__dirname, "src/global.css"),
  configPath: path.join(__dirname, "tailwind.config.ts"),
});
