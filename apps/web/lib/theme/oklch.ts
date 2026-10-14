/** Colour math for the accent engine: sRGB hex, OKLCH, and WCAG 2 contrast. */

export type Oklch = { l: number; c: number; h: number };
type Rgb = readonly [number, number, number];

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Normalizes `#rgb` or `#rrggbb` to lowercase `#rrggbb`, or `null` when it is not a hex colour. */
export function normalizeHex(value: string): string | null {
  const match = HEX.exec(value.trim());
  if (!match) return null;
  const digits = match[1]!.toLowerCase();
  return `#${digits.length === 3 ? [...digits].map((d) => d + d).join("") : digits}`;
}

function hexToLinear(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift: number) => {
    const srgb = ((value >> shift) & 255) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return [channel(16), channel(8), channel(0)];
}

function linearToOklch([r, g, b]: Rgb): Oklch {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const hue = (Math.atan2(bAxis, a) * 180) / Math.PI;
  return {
    l: lightness,
    c: Math.hypot(a, bAxis),
    h: hue < 0 ? hue + 360 : hue,
  };
}

/** Linear sRGB for an OKLCH colour; channels fall outside 0..1 when it is out of gamut. */
function oklchToLinear({ l, c, h }: Oklch): Rgb {
  const radians = (h * Math.PI) / 180;
  const a = c * Math.cos(radians);
  const b = c * Math.sin(radians);
  const lms = [
    (l + 0.3963377774 * a + 0.2158037573 * b) ** 3,
    (l - 0.1055613458 * a - 0.0638541728 * b) ** 3,
    (l - 0.0894841775 * a - 1.291485548 * b) ** 3,
  ] as const;
  return [
    4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2],
    -1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2],
    -0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2],
  ];
}

/** `hex` must come from `normalizeHex`. */
export function hexToOklch(hex: string): Oklch {
  return linearToOklch(hexToLinear(hex));
}

function luminanceOf([r, g, b]: Rgb): number {
  const clip = (channel: number) => Math.min(1, Math.max(0, channel));
  return 0.2126 * clip(r) + 0.7152 * clip(g) + 0.0722 * clip(b);
}

/** WCAG relative luminance of a `#rrggbb` hex. */
export function hexLuminance(hex: string): number {
  return luminanceOf(hexToLinear(hex));
}

/** WCAG relative luminance of an OKLCH colour, after clipping to the sRGB gamut. */
export function oklchLuminance(color: Oklch): number {
  return luminanceOf(oklchToLinear(color));
}

/** WCAG 2 contrast ratio between two relative luminances. */
export function contrastRatio(first: number, second: number): number {
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const GAMUT_EPSILON = 1e-4;

function inGamut(color: Oklch): boolean {
  return oklchToLinear(color).every(
    (channel) => channel >= -GAMUT_EPSILON && channel <= 1 + GAMUT_EPSILON,
  );
}

/** Rounds to the precision `formatOklch` prints, so what is tested is what ships. */
export function roundOklch({ l, c, h }: Oklch): Oklch {
  return {
    l: Math.round(l * 1000) / 1000,
    c: Math.floor(c * 1000) / 1000,
    h: Math.round(h * 10) / 10,
  };
}

/** The largest chroma at or below `chroma` that stays inside sRGB for this lightness and hue. */
export function clampChroma(l: number, h: number, chroma: number): number {
  const at = (c: number) => roundOklch({ l, c, h });
  if (inGamut(at(chroma))) return at(chroma).c;
  let low = 0;
  let high = chroma;
  for (let step = 0; step < 24; step++) {
    const mid = (low + high) / 2;
    if (inGamut(at(mid))) low = mid;
    else high = mid;
  }
  return at(low).c;
}

export function formatOklch(color: Oklch): string {
  const { l, c, h } = roundOklch(color);
  return `oklch(${l} ${c} ${h})`;
}

const OKLCH = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/;

/** Relative luminance of a `#rrggbb` or `oklch(l c h)` token value; used to verify shipped tokens. */
export function colorLuminance(value: string): number {
  const hex = normalizeHex(value);
  if (hex) return hexLuminance(hex);
  const match = OKLCH.exec(value);
  if (!match) throw new Error(`Unsupported colour: ${value}`);
  return oklchLuminance({
    l: Number(match[1]),
    c: Number(match[2]),
    h: Number(match[3]),
  });
}
