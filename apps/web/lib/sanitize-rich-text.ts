const ALLOWED_TAGS = new Set(["br", "p", "b", "i"]);

const TAG_RE = /<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi;

/** Neutralises any `<`/`>` left over once the real tags are handled. */
function escapeAngles(text: string): string {
  return text.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/**
 * Reduces third-party markup (lyrics, artist bios) to `<br>`, `<p>`, `<b>` and
 * `<i>` so it is safe for `dangerouslySetInnerHTML`.
 *
 * Allowed tags are re-emitted without attributes; every other tag is dropped
 * (its inner text is kept as plain text) and any stray `<` or `>` is escaped,
 * so no markup, attribute or script can survive. Text is otherwise untouched:
 * existing entities such as `&amp;` still render.
 */
export function sanitizeRichText(html: string): string {
  let out = "";
  let last = 0;

  for (const match of html.matchAll(TAG_RE)) {
    const [tag, slash, rawName] = match;
    const name = rawName.toLowerCase();

    out += escapeAngles(html.slice(last, match.index));
    if (name === "br") out += "<br>";
    else if (ALLOWED_TAGS.has(name)) out += `<${slash}${name}>`;
    last = match.index + tag.length;
  }

  return out + escapeAngles(html.slice(last));
}
