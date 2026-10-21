import nativewindPreset from "nativewind/preset";
import { platformColor, platformSelect } from "nativewind/theme";
import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

import {
  COLOR_TOKENS,
  colors,
  iosSystemColors,
  radii,
  sizes,
  spaceClasses,
} from "./src/theme/tokens";
import type { ColorToken, Palette } from "./src/theme/tokens";

const toCssVariables = (palette: Palette) =>
  Object.fromEntries(
    COLOR_TOKENS.map((token) => [`--${token}`, palette[token]]),
  );

const toPixels = (scale: Record<string, number>) =>
  Object.fromEntries(
    Object.entries(scale).map(([name, value]) => [name, `${value}px`]),
  );

/**
 * The palette as CSS variables: light on `:root`, dark under the system dark
 * scheme. Android 12+ swaps in Material You roles at runtime (`android-colors`).
 */
const paletteVariables = plugin(({ addBase }) => {
  addBase({
    ":root": toCssVariables(colors.light),
    "@media (prefers-color-scheme: dark)": {
      ":root": toCssVariables(colors.dark),
    },
  });
});

/** A UIKit system colour on iOS, the palette variable everywhere else. */
function tokenColor(token: ColorToken) {
  const paletteValue = `var(--${token})`;
  const systemColor = iosSystemColors[token];
  return systemColor
    ? platformSelect({ ios: platformColor(systemColor), default: paletteValue })
    : paletteValue;
}

export default {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [nativewindPreset],
  theme: {
    extend: {
      colors: Object.fromEntries(
        COLOR_TOKENS.map((token) => [token, tokenColor(token)]),
      ),
      borderRadius: toPixels(radii),
      // NativeWind's rem is 14, so Tailwind's own `*-4` would be 14pt: the
      // 4pt steps are pinned in points (`p-4` is 16).
      spacing: { ...toPixels(spaceClasses), ...toPixels(sizes) },
    },
  },
  plugins: [paletteVariables],
} satisfies Config;
