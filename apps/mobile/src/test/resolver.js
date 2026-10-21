const reanimatedResolver = require("react-native-reanimated/jest/resolver");
const { resolver: presetResolverPath } = require("jest-expo/jest-preset");

const presetResolver = require(presetResolverPath);

/**
 * Jest's module resolver: Reanimated 4's own (which hands worklets' to
 * `react-native-worklets/jest/resolver`) picks the web builds of the modules
 * that have no Jest-capable native side, layered over the React Native
 * preset's resolver. Real Reanimated then runs in every suite, so no
 * component needs a per-test stand-in for an animated view.
 *
 * @type {import("jest-resolve").SyncResolver}
 */
module.exports = (request, options) =>
  reanimatedResolver(request, {
    ...options,
    defaultResolver: (path, nested) =>
      presetResolver(path, {
        ...nested,
        defaultResolver: options.defaultResolver,
      }),
  });
