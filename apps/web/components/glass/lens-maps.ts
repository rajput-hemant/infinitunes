import { createDisplacementMap, createSpecularMap } from "~/lib/glass/engine";
import type { MapResult } from "~/lib/glass/engine";

export type LensMaps = { displacement: string; specular: string };

export type LensMapRequest = {
  width: number;
  height: number;
  radius: number;
  bezel: number;
  /** 0 for a plain surface, `DROPLET_MAGNIFY` for a lifted selection droplet. */
  magnify: number;
};

/** Renders the displacement and specular maps for one size as PNG data URLs. */
export type LensMapEncoder = (request: LensMapRequest) => LensMaps | null;

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

/** Default encoder: pure map generators, then a canvas PNG encode. Runs once per size. */
export const encodeLensMaps: LensMapEncoder = ({
  width,
  height,
  radius,
  bezel,
  magnify,
}) => {
  const displacement = toDataURL(
    createDisplacementMap({ width, height, radius, bezel, magnify }),
  );
  const specular = toDataURL(
    createSpecularMap({ width, height, radius, bezel }),
  );
  return displacement && specular ? { displacement, specular } : null;
};
