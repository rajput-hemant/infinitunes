import { decode } from "@infinitunes/types";

const LINE_BREAKS = /<\s*(?:br\s*\/?|\/p)\s*>/gi;
const TAGS = /<[^>]*>/g;

/**
 * Show and episode descriptions are HTML fragments. Native text has no
 * markup, so line breaks become newlines, every tag is dropped, and only
 * then are entities decoded (so an encoded `&lt;b&gt;` stays literal text).
 */
export function plainText(html: string | undefined): string {
  return decode(
    (html ?? "").replace(LINE_BREAKS, "\n").replace(TAGS, ""),
  ).trim();
}
