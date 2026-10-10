import {
  clampChroma,
  contrastRatio,
  formatOklch,
  hexLuminance,
  hexToOklch,
  oklchLuminance,
  roundOklch,
} from "./oklch";
import type { Oklch } from "./oklch";

/** WCAG AA for normal text. */
export const AA_CONTRAST = 4.5;

// Headroom so the 8-bit rounding a browser applies to the final colour cannot dip below AA.
const TARGET_CONTRAST = AA_CONTRAST + 0.05;

/**
 * Page surfaces an accent must stay legible on. Mirrors `--background` and
 * `--card` in `styles/globals.css`; `theme-contrast.test.ts` enforces that.
 */
export const SURFACES = {
  light: { background: "#f5f5f7", card: "#ffffff" },
  dark: { background: "#0b0b0c", card: "#1c1c1e" },
} as const;

export type Scheme = keyof typeof SURFACES;

export type AccentScheme = {
  /** Fill and text colour of the accent. */
  primary: string;
  /** Text and icons drawn on `primary`. */
  primaryForeground: string;
  /** Soft accent-tinted surface for hover and selected states. */
  accent: string;
};

export type AccentTokens = Record<Scheme, AccentScheme>;

const ON_LIGHT: Oklch = { l: 0.18, c: 0, h: 0 };
const ON_DARK: Oklch = { l: 1, c: 0, h: 0 };

// Below this luminance an accent vanishes on dark surfaces; flip it to a light neutral.
const DARK_FLIP_LUMINANCE = 0.03;
const DARK_FLIP_HEX = "#f4f4f5";

const LIGHTNESS_STEP = 0.002;
const TINT = {
  light: { l: 0.94, maxChroma: 0.04 },
  dark: { l: 0.3, maxChroma: 0.04 },
} as const;

function surfaceLuminances(scheme: Scheme) {
  return Object.values(SURFACES[scheme]).map(hexLuminance);
}

/** The better text colour on `primary` when it clears AA, else `null`. */
function legibleForeground(primary: Oklch, scheme: Scheme): Oklch | null {
  const luminance = oklchLuminance(primary);
  const onSurface = Math.min(
    ...surfaceLuminances(scheme).map((surface) =>
      contrastRatio(luminance, surface),
    ),
  );
  if (onSurface < TARGET_CONTRAST) return null;

  const best = [ON_DARK, ON_LIGHT]
    .map((foreground) => ({
      foreground,
      ratio: contrastRatio(luminance, oklchLuminance(foreground)),
    }))
    .reduce((a, b) => (b.ratio > a.ratio ? b : a));
  return best.ratio >= TARGET_CONTRAST ? best.foreground : null;
}

function deriveScheme(base: Oklch, scheme: Scheme): AccentScheme {
  // Nearest lightness to the requested accent that clears AA on both surfaces
  // and for its own text colour. Hue and chroma are kept (chroma only shrinks
  // to stay inside sRGB), so the colour changes as little as possible.
  const towardContrast = scheme === "light" ? -1 : 1;
  for (let step = 0; step <= 1 / LIGHTNESS_STEP; step++) {
    for (const direction of [towardContrast, -towardContrast]) {
      const l = base.l + direction * step * LIGHTNESS_STEP;
      if (l < 0 || l > 1) continue;
      const candidate = roundOklch({
        l,
        c: clampChroma(l, base.h, base.c),
        h: base.h,
      });
      const foreground = legibleForeground(candidate, scheme);
      if (foreground) {
        const tintLightness = TINT[scheme].l;
        const tintChroma = Math.min(candidate.c * 0.3, TINT[scheme].maxChroma);
        const tint = { l: tintLightness, c: tintChroma, h: candidate.h };
        return {
          primary: formatOklch(candidate),
          primaryForeground: formatOklch(foreground),
          accent: formatOklch({
            ...tint,
            c: clampChroma(tint.l, tint.h, tintChroma),
          }),
        };
      }
    }
  }
  // Unreachable: pure black and pure white always satisfy one scheme each.
  throw new Error(`No accessible accent found for ${scheme}`);
}

/**
 * Turns any accent into the shipped token set for both schemes. Every
 * `primary` clears WCAG AA (4.5:1) on both page surfaces of its scheme and
 * `primaryForeground` clears it on `primary`, so text on and of the accent is
 * always legible. Colours that fail are moved along lightness, nothing else.
 * `hex` must come from `normalizeHex`.
 */
export function deriveAccentTokens(hex: string): AccentTokens {
  const base = hexToOklch(hex);
  const darkBase =
    hexLuminance(hex) < DARK_FLIP_LUMINANCE ? hexToOklch(DARK_FLIP_HEX) : base;
  return {
    light: deriveScheme(base, "light"),
    dark: deriveScheme(darkBase, "dark"),
  };
}

export type AccentVariable =
  | "--light-primary"
  | "--light-primary-foreground"
  | "--light-accent"
  | "--dark-primary"
  | "--dark-primary-foreground"
  | "--dark-accent";

/**
 * The inline variables `styles/globals.css` reads: `--light-*` feeds `:root`
 * and `--dark-*` feeds `.dark`, so the server need not know which scheme wins.
 */
export function accentVariables({
  light,
  dark,
}: AccentTokens): Record<AccentVariable, string> {
  return {
    "--light-primary": light.primary,
    "--light-primary-foreground": light.primaryForeground,
    "--light-accent": light.accent,
    "--dark-primary": dark.primary,
    "--dark-primary-foreground": dark.primaryForeground,
    "--dark-accent": dark.accent,
  };
}
