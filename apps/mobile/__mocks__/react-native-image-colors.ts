/**
 * `react-native-image-colors` is a native module with no Jest build; Jest
 * picks this up for every suite (a node_modules mock beside `node_modules`).
 * By default it finds no swatch, and answers like the native module then
 * does: the config's `fallback` in every field. Screens render the D1
 * palette; a suite scripts `jest.mocked(getColors).mockResolvedValue(...)`
 * for a wash, and re-arms `findsNoSwatch` after resetting the mock.
 */
import type { getColors as real } from "react-native-image-colors";
import type { ImageColorsResult } from "react-native-image-colors";

type Config = Parameters<typeof real>[1];

export async function findsNoSwatch(
  _uri: string,
  config?: Config,
): Promise<ImageColorsResult> {
  const fallback = config?.fallback ?? "#000000";
  return {
    platform: "ios",
    background: fallback,
    primary: fallback,
    secondary: fallback,
    detail: fallback,
    quality: config?.quality ?? "low",
  };
}

export const getColors = jest.fn(findsNoSwatch);

export const cache = { getItem: jest.fn(), setItem: jest.fn() };

export default { getColors, cache };
