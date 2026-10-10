import { SAMPLE_GRID, rgbCss, summarizePixels } from "~/lib/glass/artwork";
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
 * Samples an artwork into an 8x8 grid: mean colour, mean luminance and three
 * vivid seeds. Cached by URL; `null` when the image fails to load or the
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

/** Writes the sample onto `<html>`: luminance, mean colour and the three ambient blobs. */
export function applyArtworkTint(sample: ArtworkSample) {
  const style = document.documentElement.style;
  style.setProperty("--g-art-l", sample.luminance.toFixed(3));
  style.setProperty("--g-art", rgbCss(sample.avg));
  sample.blobs.forEach((blob, i) => {
    style.setProperty(`--g-blob-${i + 1}`, rgbCss(blob));
  });
}

/** Back to the stylesheet defaults when nothing is playing. */
export function clearArtworkTint() {
  const style = document.documentElement.style;
  for (const name of [
    "--g-art-l",
    "--g-art",
    "--g-blob-1",
    "--g-blob-2",
    "--g-blob-3",
  ]) {
    style.removeProperty(name);
  }
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
