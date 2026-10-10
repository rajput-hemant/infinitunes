export function lensCapable(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined")
    return false;
  const params = new URLSearchParams(window.location.search);
  const q = params.get("lens");
  if (q === "0") return false;
  const syntax = Boolean(
    window.CSS && CSS.supports("backdrop-filter", "url(#lg) blur(1px)"),
  );
  const prims =
    "SVGFEDisplacementMapElement" in window && "SVGFEImageElement" in window;
  if (q === "1") return syntax && prims;

  const nav = window.navigator as any;
  const brands = (nav.userAgentData && nav.userAgentData.brands) || [];
  const chromium = brands.some((b: any) =>
    /Chromium|Google Chrome|Microsoft Edge/.test(b.brand),
  );
  return syntax && prims && chromium;
}
