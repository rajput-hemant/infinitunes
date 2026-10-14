import { createDisplacementMap } from "~/lib/glass/engine";
import type { DisplacementMapOpts, MapResult } from "~/lib/glass/engine";

/** What one lens map depends on: size, corner radius, rim shape and magnification. */
export type LensMapRequest = Required<DisplacementMapOpts>;

/** Renders the displacement map for one shape as a PNG data URL. */
export type LensMapEncoder = (request: LensMapRequest) => string | null;

let canvas: HTMLCanvasElement | null = null;

function toDataURL(map: MapResult): string | null {
  canvas ??= document.createElement("canvas");
  canvas.width = map.width;
  canvas.height = map.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.putImageData(
    new ImageData(new Uint8ClampedArray(map.data), map.width, map.height),
    0,
    0,
  );
  return canvas.toDataURL("image/png");
}

/** Default encoder: the pure map generator, then a canvas PNG encode. Runs once per shape. */
export const encodeLensMap: LensMapEncoder = (request) =>
  toDataURL(createDisplacementMap(request));
