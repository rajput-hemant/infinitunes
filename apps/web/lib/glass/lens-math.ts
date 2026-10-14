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

/** feDisplacementMap `scale` in px: the displacement the rim reaches (about 40% of it), scaled per class. */
export function lensScale(
  depth: number,
  strength: number,
  progress = 1,
): number {
  return depth * strength * progress;
}

/** Red takes the larger displacement and green with blue the smaller one, like the pen's two-pass fringe. */
export function chromaScales(
  scale: number,
  chroma: number,
): { red: number; rest: number } {
  return { red: scale * (1 + chroma), rest: scale * (1 - chroma) };
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

/** The part of the tuning that changes the map itself (depth only rescales the filter). */
export type LensShape = {
  splay: number;
  feather: number;
  curve: number;
  /** Whether the filter needs the two-pass red / green-blue split. */
  chromatic: boolean;
  /** Whether the filter multiplies the refracted backdrop by the tint colour. */
  tinted: boolean;
  /** A surface's own preset: its depth, chroma and tint are baked in rather than following the global tuning. */
  fixed: {
    depth: number;
    chroma: number;
    tint: number;
    tintColor: string;
  } | null;
};

/** Cache key: a filter is only valid for the exact size, radius, rim shape, class, magnify and origin shift. */
export function lensKey(
  width: number,
  height: number,
  radius: number,
  size: GlassSize,
  magnify: boolean,
  shape: LensShape,
  origin: { x: number; y: number } = { x: 0, y: 0 },
): string {
  const rim = `s${shape.splay}f${shape.feather}c${shape.curve}`;
  const shift = origin.x || origin.y ? `o${origin.x},${origin.y}` : "";
  const { fixed } = shape;
  const own = fixed
    ? `d${fixed.depth}x${fixed.chroma}t${fixed.tint}${fixed.tintColor}`
    : "";
  return `${width}x${height}r${radius}${rim}${size}${magnify ? "m" : ""}${shape.chromatic ? "x" : ""}${shape.tinted ? "t" : ""}${own}${shift}`;
}

/** Ease-out cubic, the curve the materialize lens ramp follows. */
export function easeOutCubic(k: number): number {
  return 1 - Math.pow(1 - k, 3);
}

/** Materialize ramps the lens `scale` from 0 to 1 over this long. */
export const MATERIALIZE_MS = 320;
