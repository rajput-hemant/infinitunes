/** Signed distance from a point (relative to the box centre) to a rounded rectangle's edge; negative inside. */
export function roundedRectSDF(
  x: number,
  y: number,
  halfW: number,
  halfH: number,
  radius: number,
): number {
  const qx = Math.abs(x) - (halfW - radius);
  const qy = Math.abs(y) - (halfH - radius);
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    radius
  );
}

export type MapResult = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

export type DisplacementMapOpts = {
  width: number;
  height: number;
  radius: number;
  /** Width of the refracting ring centred on the edge, px. */
  splay: number;
  /** Extra width of the ring on the inner side, px. */
  feather: number;
  /** Exponent applied to the ring profile. */
  curve: number;
  /** Linear magnification across the whole surface (the lifted selection droplet). */
  magnify?: number;
};

/** Peak map displacement as a share of the channel range, so edge pixels never clip. */
const BOOST = 0.8;
const MID = 127.5;
const HALF_RANGE = 127;

const clamp255 = (value: number) => (value < 0 ? 0 : value > 255 ? 255 : value);

/** Profile of the ring at signed distance `s` from the edge: 1 on the edge, 0 at its limit. */
export function ringAmount(
  s: number,
  splay: number,
  feather: number,
  curve: number,
): number {
  const span = s < 0 ? splay + feather : splay;
  let amt = Math.max(0, 1 - Math.abs(s) / span);
  amt = amt * amt * amt * (amt * (amt * 6 - 15) + 10);
  return Math.pow(amt, curve);
}

/**
 * Displacement map for `feDisplacementMap` (R = x, G = y, 128 is no shift).
 * A rounded-rect distance ring: the content is pulled from inside toward the
 * edge, hardest on the edge and easing out over `splay + feather` px, so the
 * rim bends what is behind it and the middle stays still. The map has 4-fold
 * symmetry, so one quadrant is computed and mirrored with the offsets negated.
 */
export function createDisplacementMap({
  width,
  height,
  radius,
  splay,
  feather,
  curve,
  magnify = 0,
}: DisplacementMapOpts): MapResult {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const halfW = w / 2;
  const halfH = h / 2;
  const half = Math.min(halfW, halfH);
  const data = new Uint8ClampedArray(w * h * 4);
  const sdf = (x: number, y: number) => roundedRectSDF(x, y, halfW, halfH, r);

  const put = (x: number, y: number, vx: number, vy: number) => {
    const i = (y * w + x) * 4;
    data[i] = clamp255(Math.round(MID + vx));
    data[i + 1] = clamp255(Math.round(MID + vy));
    data[i + 2] = 128;
    data[i + 3] = 255;
  };

  for (let y = 0; y < Math.ceil(h / 2); y++) {
    for (let x = 0; x < Math.ceil(w / 2); x++) {
      const cx = x + 0.5 - halfW;
      const cy = y + 0.5 - halfH;
      const gx = sdf(cx + 1, cy) - sdf(cx - 1, cy);
      const gy = sdf(cx, cy + 1) - sdf(cx, cy - 1);
      const len = Math.hypot(gx, gy) || 1;
      const amt = ringAmount(sdf(cx, cy), splay, feather, curve);
      const vx =
        (-(gx / len) * amt * BOOST - (cx / half) * magnify) * HALF_RANGE;
      const vy =
        (-(gy / len) * amt * BOOST - (cy / half) * magnify) * HALF_RANGE;
      put(x, y, vx, vy);
      put(w - 1 - x, y, -vx, vy);
      put(x, h - 1 - y, vx, -vy);
      put(w - 1 - x, h - 1 - y, -vx, -vy);
    }
  }
  return { data, width: w, height: h };
}
