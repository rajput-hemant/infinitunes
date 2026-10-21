/**
 * `react-native-image-colors` is a native module with no Jest build; Jest
 * picks this up for every suite (a node_modules mock beside `node_modules`).
 * By default it finds no colours, so screens render the D1 palette; a suite
 * scripts `jest.mocked(getColors).mockResolvedValue(...)` for a wash.
 */
import type { ImageColorsResult } from "react-native-image-colors";

export const getColors = jest.fn(
  async (_uri: string, _config?: object): Promise<ImageColorsResult> => {
    throw new Error("No artwork colours in Jest");
  },
);

export const cache = { getItem: jest.fn(), setItem: jest.fn() };

export default { getColors, cache };
