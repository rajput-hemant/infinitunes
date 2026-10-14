import { SAMPLE_GRID, summarizePixels } from "~/lib/glass/artwork";
import type { ArtworkSample } from "~/lib/glass/artwork";

const samples = new Map<string, Promise<ArtworkSample | null>>();
let canvas: HTMLCanvasElement | null = null;

function draw(img: HTMLImageElement): ArtworkSample | null {
  canvas ??= document.createElement("canvas");
  canvas.width = canvas.height = SAMPLE_GRID;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  try {
    ctx.drawImage(img, 0, 0, SAMPLE_GRID, SAMPLE_GRID);
    return summarizePixels(
      ctx.getImageData(0, 0, SAMPLE_GRID, SAMPLE_GRID).data,
    );
  } catch {
    // Tainted canvas (a CDN without CORS): keep the neutral defaults.
    return null;
  }
}

/**
 * Samples an artwork into an 8x8 grid and returns its mean luminance. Cached by URL; `null` when the image fails to load or the
 * canvas is tainted. The image CDN must send `Access-Control-Allow-Origin`.
 */
export function sampleArtwork(url: string): Promise<ArtworkSample | null> {
  const cached = samples.get(url);
  if (cached) return cached;
  const result = new Promise<ArtworkSample | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(draw(img));
    img.onerror = () => resolve(null);
    img.src = url;
  });
  samples.set(url, result);
  return result;
}

/** A clear surface adapts to the image directly behind it (`parent > img`), not the playing artwork. */
export function sampleBehind(el: HTMLElement) {
  const img = el.parentElement?.querySelector<HTMLImageElement>(":scope > img");
  const url = img?.currentSrc || img?.src;
  if (!url) return;
  void sampleArtwork(url).then((sample) => {
    if (sample) el.style.setProperty("--g-art-l", sample.luminance.toFixed(3));
  });
}
