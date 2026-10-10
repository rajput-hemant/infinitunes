type NavigatorWithBrands = Navigator & {
  userAgentData?: { brands: { brand: string }[] };
};

const CHROMIUM_BRAND = /Chromium|Google Chrome|Microsoft Edge/;

/**
 * Whether `backdrop-filter: url(#filter)` refraction can run. Only Chromium
 * resolves SVG filters inside backdrop-filter, so other engines get the frosted
 * CSS fallback. `?lens=0` forces the fallback and `?lens=1` skips the brand check.
 */
export function lensCapable(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined")
    return false;

  const forced = new URLSearchParams(window.location.search).get("lens");
  if (forced === "0") return false;

  const supportsSyntax = CSS.supports("backdrop-filter", "url(#lg) blur(1px)");
  const supportsPrimitives =
    "SVGFEDisplacementMapElement" in window && "SVGFEImageElement" in window;
  if (forced === "1") return supportsSyntax && supportsPrimitives;

  const brands = (window.navigator as NavigatorWithBrands).userAgentData
    ?.brands;
  const isChromium = brands?.some(({ brand }) => CHROMIUM_BRAND.test(brand));
  return supportsSyntax && supportsPrimitives && Boolean(isChromium);
}
