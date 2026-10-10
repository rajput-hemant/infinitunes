/** True when the user asked for less motion: the in-app switch or the OS setting. */
export function prefersReducedMotion(): boolean {
  if (typeof document === "undefined") return false;
  if (document.documentElement.getAttribute("data-motion") === "reduced")
    return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
