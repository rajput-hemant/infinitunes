export type Rgb = readonly [number, number, number];
export type Hsl = readonly [number, number, number];

/** Result of sampling an artwork image down to a coarse grid. */
export type ArtworkSample = {
  /** Mean colour. */
  avg: Rgb;
  /** Mean relative luminance, 0 to 1. */
  luminance: number;
  /** Three vivid colours seeding the ambient field. */
  blobs: readonly [Rgb, Rgb, Rgb];
};

/** The sampler draws the image into a grid of this many cells per side. */
export const SAMPLE_GRID = 8;

const srgbToLinear = (value: number) => {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

export function toHsl([r, g, b]: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const mx = Math.max(rn, gn, bn);
  const mn = Math.min(rn, gn, bn);
  const d = mx - mn;
  let hue = 0;
  if (d) {
    hue =
      mx === rn
        ? ((gn - bn) / d) % 6
        : mx === gn
          ? (bn - rn) / d + 2
          : (rn - gn) / d + 4;
  }
  return [
    (hue * 60 + 360) % 360,
    d < 0.04 ? 0 : d / (1 - Math.abs(mx + mn - 1)),
    (mx + mn) / 2,
  ];
}

export function fromHsl([hue, sat, l]: Hsl): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const [a, b, d] =
    hue < 60
      ? [c, x, 0]
      : hue < 120
        ? [x, c, 0]
        : hue < 180
          ? [0, c, x]
          : hue < 240
            ? [0, x, c]
            : hue < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [
    Math.round((a + m) * 255),
    Math.round((b + m) * 255),
    Math.round((d + m) * 255),
  ];
}

const hueDistance = (a: number, b: number) =>
  Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

/**
 * Sampled colours become vivid swatches (HSL saturation >= 0.7, lightness 0.5
 * to 0.62) so the field glows. When all three land within 40 degrees of hue
 * (warm covers do), blobs 2 and 3 rotate to +300 and +60 degrees from blob 1.
 */
export function vividSet(colours: readonly [Rgb, Rgb, Rgb]): [Rgb, Rgb, Rgb] {
  const hsl = colours.map((c): [number, number, number] => {
    const [h, s, l] = toHsl(c);
    return [h, Math.max(0.7, s), Math.min(0.62, Math.max(0.5, l))];
  });
  const [first, second, third] = hsl;
  const spread = Math.max(
    hueDistance(first[0], second[0]),
    hueDistance(first[0], third[0]),
    hueDistance(second[0], third[0]),
  );
  if (spread < 40) {
    second[0] = (first[0] + 300) % 360;
    third[0] = (first[0] + 60) % 360;
  }
  return [fromHsl(first), fromHsl(second), fromHsl(third)];
}

const chroma = ([r, g, b]: Rgb) => Math.max(r, g, b) - Math.min(r, g, b);

/**
 * Reduces RGBA pixels of an `SAMPLE_GRID` square image to the mean colour,
 * mean luminance and three vivid seeds: the most saturated cell in row bands
 * 0-2, 3-4 and 5-7. `null` when the buffer is not a full grid.
 */
export function summarizePixels(
  data: ArrayLike<number>,
  grid: number = SAMPLE_GRID,
): ArtworkSample | null {
  const cells = grid * grid;
  if (data.length < cells * 4) return null;
  let r = 0;
  let g = 0;
  let b = 0;
  let luminance = 0;
  const colours: Rgb[] = [];
  for (let i = 0; i < cells * 4; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    luminance +=
      0.2126 * srgbToLinear(data[i]) +
      0.7152 * srgbToLinear(data[i + 1]) +
      0.0722 * srgbToLinear(data[i + 2]);
    colours.push([data[i], data[i + 1], data[i + 2]]);
  }
  const band = (from: number, to: number): Rgb => {
    const cellsInBand = colours.slice(from * grid, to * grid);
    return cellsInBand.reduce((best, c) =>
      chroma(c) > chroma(best) ? c : best,
    );
  };
  const rows = grid / 8;
  return {
    avg: [Math.round(r / cells), Math.round(g / cells), Math.round(b / cells)],
    luminance: luminance / cells,
    blobs: vividSet([
      band(0, 3 * rows),
      band(3 * rows, 5 * rows),
      band(5 * rows, 8 * rows),
    ]),
  };
}

export const rgbCss = (c: Rgb) => `rgb(${c.join(" ")})`;
