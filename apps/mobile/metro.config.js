const path = require("node:path");

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

module.exports = withNativeWind(getDefaultConfig(__dirname), {
  input: path.join(__dirname, "src/global.css"),
  configPath: path.join(__dirname, "tailwind.config.ts"),
});
