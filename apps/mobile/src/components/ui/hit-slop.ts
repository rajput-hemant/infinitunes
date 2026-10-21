/**
 * Hit slop for a one-line text button ("See All", "Clear"): its 20pt line plus
 * 14pt above and below is the 48pt touch height; the sides add reach for short
 * words.
 */
export const TEXT_BUTTON_HIT_SLOP = {
  top: 14,
  bottom: 14,
  left: 12,
  right: 12,
} as const;
