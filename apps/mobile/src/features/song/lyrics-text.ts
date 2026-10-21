import { decode } from "@infinitunes/types";

/**
 * Upstream lyrics are HTML: `<br>` breaks lines, anything else is markup to
 * drop. Plain text is all the screen renders, so no HTML engine is needed.
 */
export function lyricsText(html: string): string {
  return decode(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .trim(),
  );
}
