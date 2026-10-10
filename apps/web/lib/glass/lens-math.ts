/** Surface thickness classes; see docs/design-system/glass.md. */
export type GlassSize = "s" | "m" | "l" | "xl";

/** Bigger surfaces are thicker, so their lens is weaker. `xl` never refracts. */
const LENS_STRENGTH: Record<GlassSize, number> = {
  s: 1,
  m: 0.75,
  l: 0.45,
  xl: 0,
};
const MAGNIFY_STRENGTH = 0.7;

/** Magnification added across a lifted selection droplet. */
export const DROPLET_MAGNIFY = 0.12;

/** Lens is skipped above this area (px): the map and the filter cost grow with it. */
export const MAX_LENS_AREA = 900 * 700;
const MIN_LENS_SIDE = 8;

export function lensStrength(size: GlassSize, magnify: boolean): number {
  return LENS_STRENGTH[size] * (magnify ? MAGNIFY_STRENGTH : 1);
}

/** feDisplacementMap `scale`: twice the peak offset, so the offset is +-refraction px at strength 1. */
export function lensScale(
  refraction: number,
  strength: number,
  progress = 1,
): number {
  return 2 * refraction * strength * progress;
}

/** Slope of the baked specular alpha, capped so the highlight never clips to a flat white. */
export function specularSlope(spec: number): number {
  return Math.min(1.5, spec * 0.8);
}

/** Bezel width in px: the part of the surface the lens bends. Never exceeds the corner radius. */
export function bezelFor(
  width: number,
  height: number,
  radius: number,
  size: GlassSize,
): number {
  const share = size === "s" ? 0.32 : 0.22;
  return Math.round(
    Math.min(
      radius,
      Math.max(8, Math.min(width, height) * share),
      size === "l" ? 22 : 18,
    ),
  );
}

export type LensTarget = {
  size: GlassSize;
  width: number;
  height: number;
  /** `data-lens="off"` */
  off: boolean;
};

/** Whether a surface of this size should get a refraction filter at all. */
export function canLens({ size, width, height, off }: LensTarget): boolean {
  if (off || size === "xl") return false;
  if (width < MIN_LENS_SIDE || height < MIN_LENS_SIDE) return false;
  return width * height <= MAX_LENS_AREA;
}

/** Cache key: a map is only valid for the exact size, radius, bezel and magnify. */
export function lensKey(
  width: number,
  height: number,
  radius: number,
  size: GlassSize,
  magnify: boolean,
): string {
  const bezel = bezelFor(width, height, radius, size);
  return `${width}x${height}r${radius}b${bezel}${size}${magnify ? "m" : ""}`;
}

/** Ease-out cubic, the curve the materialize lens ramp follows. */
export function easeOutCubic(k: number): number {
  return 1 - Math.pow(1 - k, 3);
}

/** Materialize ramps the lens `scale` from 0 to 1 over this long. */
export const MATERIALIZE_MS = 320;
