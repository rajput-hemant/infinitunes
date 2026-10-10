import type { GlassLevel } from "@infinitunes/types";

type NavigatorWithBrands = Navigator & {
  userAgentData?: { brands: { brand: string }[] };
};

const CHROMIUM_BRAND = /Chromium|Google Chrome|Microsoft Edge/;

/** `?lens=0` forces the frosted fallback, `?lens=1` skips the engine check. */
export type LensOverride = "off" | "force" | null;

export function parseLensOverride(search: string): LensOverride {
  const value = new URLSearchParams(search).get("lens");
  if (value === "0") return "off";
  if (value === "1") return "force";
  return null;
}

export type LensSupport = {
  override: LensOverride;
  /** `CSS.supports("backdrop-filter", "url(#lg) blur(1px)")` */
  backdropUrlSyntax: boolean;
  /** `SVGFEDisplacementMapElement` and `SVGFEImageElement` exist. */
  svgPrimitives: boolean;
  /** `navigator.userAgentData.brands` lists a Chromium-family brand. */
  chromium: boolean;
};

/**
 * Whether `backdrop-filter: url(#filter)` refraction can run. Only Chromium
 * renders SVG filters inside backdrop-filter; Safari and Firefox parse the
 * syntax and draw nothing, so the brand is the tiebreaker.
 */
export function isLensCapable(support: LensSupport): boolean {
  if (support.override === "off") return false;
  const base = support.backdropUrlSyntax && support.svgPrimitives;
  if (support.override === "force") return base;
  return base && support.chromium;
}

/** Reads the live browser; `false` on the server. */
export function lensCapable(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined")
    return false;
  const brands = (window.navigator as NavigatorWithBrands).userAgentData
    ?.brands;
  return isLensCapable({
    override: parseLensOverride(window.location.search),
    backdropUrlSyntax:
      typeof CSS !== "undefined" &&
      CSS.supports("backdrop-filter", "url(#lg) blur(1px)"),
    svgPrimitives:
      "SVGFEDisplacementMapElement" in window && "SVGFEImageElement" in window,
    chromium: Boolean(brands?.some(({ brand }) => CHROMIUM_BRAND.test(brand))),
  });
}

export type LensConditions = {
  capable: boolean;
  level: GlassLevel;
  reducedTransparency: boolean;
  highContrast: boolean;
};

/**
 * The lens runs when the browser can refract, the level is not Solid, and the
 * user has not asked for less transparency or more contrast.
 */
export function lensActive({
  capable,
  level,
  reducedTransparency,
  highContrast,
}: LensConditions): boolean {
  return capable && level !== "solid" && !reducedTransparency && !highContrast;
}

/** Value of `html[data-glass-engine]`, which the stylesheet keys the lens rules on. */
export type GlassEngine = "lens" | "frost";
