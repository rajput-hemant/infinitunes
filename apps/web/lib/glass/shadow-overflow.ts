export type Origin = { x: number; y: number };

/** Skia blurs shadows out to three standard deviations, and sigma is half the blur radius. */
const BLUR_EXTENT = 1.5;

/** Splits a computed `box-shadow` list on its top-level commas (colors hold commas of their own). */
function splitShadows(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(value.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

/**
 * Chromium resolves a `backdrop-filter` reference filter's user space against
 * the element's ink overflow, not its border box: user point (0, 0) lands this
 * far right and down of the border box's top-left, by how far the outer
 * shadows reach past the left and top edges. A lens sized to the border box
 * must be offset by the negative of this, or its region and maps are shifted
 * and the part of the surface outside the shifted region stays unfiltered.
 *
 * `viewport` is the border box's distance from the viewport's left and top
 * edges; the reach is capped by it because Chromium clips the ink overflow to
 * the viewport (a menu 48px from the top has a y origin of 48, not 57).
 */
export function inkOverflowOrigin(
  boxShadow: string,
  viewport: Origin = { x: Infinity, y: Infinity },
): Origin {
  let x = 0;
  let y = 0;
  for (const shadow of splitShadows(boxShadow)) {
    if (/\binset\b/.test(shadow)) continue;
    const lengths = [...shadow.matchAll(/(-?\d*\.?\d+)px/g)].map((m) =>
      Number(m[1]),
    );
    if (lengths.length < 2) continue;
    const [dx, dy, blur = 0, spread = 0] = lengths;
    const reach = BLUR_EXTENT * blur + spread;
    x = Math.max(x, reach - dx);
    y = Math.max(y, reach - dy);
  }
  // The ink overflow is clipped to the viewport: an element 48px from the top has at most 48px of it above.
  return {
    x: Math.round(Math.min(x, Math.max(0, viewport.x))),
    y: Math.round(Math.min(y, Math.max(0, viewport.y))),
  };
}
