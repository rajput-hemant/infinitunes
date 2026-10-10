/** Scroll distance (px) past which the top edge effect fades in. */
export const SCROLLED_AFTER = 4;

export function isScrolled(y: number, threshold: number = SCROLLED_AFTER) {
  return y > threshold;
}
