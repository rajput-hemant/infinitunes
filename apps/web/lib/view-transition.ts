/**
 * Shared-element morph keys. A card's artwork and the artwork of the page it
 * opens carry the same `view-transition-name`, so the browser flies one into
 * the other. `data-morph` marks a card, `data-morph-art` its artwork.
 */
export const MORPH_CLASS = "vt-morph";

export function morphName(type: string, token: string): string {
  return `art-${type}-${token}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}
