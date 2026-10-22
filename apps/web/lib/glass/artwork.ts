import { srgbToLinear } from "../theme/oklch";

/** Result of sampling an artwork image down to a coarse grid. */
export type ArtworkSample = {
  /** Mean relative luminance, 0 to 1. */
  luminance: number;
};

/** The sampler draws the image into a grid of this many cells per side. */
export const SAMPLE_GRID = 8;

/**
 * Reduces RGBA pixels of an `SAMPLE_GRID` square image to its mean luminance.
 * `null` when the buffer is not a full grid.
 */
export function summarizePixels(
  data: ArrayLike<number>,
  grid: number = SAMPLE_GRID,
): ArtworkSample | null {
  const cells = grid * grid;
  if (data.length < cells * 4) return null;
  let luminance = 0;
  for (let i = 0; i < cells * 4; i += 4) {
    luminance +=
      0.2126 * srgbToLinear((data[i] ?? 0) / 255) +
      0.7152 * srgbToLinear((data[i + 1] ?? 0) / 255) +
      0.0722 * srgbToLinear((data[i + 2] ?? 0) / 255);
  }
  return { luminance: luminance / cells };
}
