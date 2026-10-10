export type SDFResult = { d: number; nx: number; ny: number };

export function roundedRectSDF(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): SDFResult {
  const px = x - w / 2,
    py = y - h / 2;
  const qx = Math.abs(px) - (w / 2 - r),
    qy = Math.abs(py) - (h / 2 - r);
  const sx = px < 0 ? -1 : 1,
    sy = py < 0 ? -1 : 1;
  if (qx > 0 && qy > 0) {
    const l = Math.hypot(qx, qy);
    return { d: l - r, nx: (qx / l) * sx, ny: (qy / l) * sy };
  }
  const d = Math.max(qx, qy) - r + Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return qx > qy ? { d, nx: sx, ny: 0 } : { d, nx: 0, ny: sy };
}

// Convex squircle bezel: height rises from 0 at the rim to 1 at the inner edge of the bezel (t in 0..1).
const bezelHeight = (t: number) => Math.pow(1 - Math.pow(1 - t, 4), 0.25);

// dh/dt by central difference; the glass is as tall as the bezel is wide, so this is also the surface slope.
const bezelSlope = (t: number) => {
  const e = 1e-3,
    a = Math.max(0, t - e),
    b = Math.min(1, t + e);
  return (bezelHeight(b) - bezelHeight(a)) / (b - a);
};

// Lateral ray displacement (in units of the bezel width) at normalised bezel position t, by Snell's law.
export function refractionAt(
  t: number,
  ior: number,
  thickness: number,
): number {
  const theta1 = Math.atan(bezelSlope(t));
  const theta2 = Math.asin(Math.sin(theta1) / ior);
  return (bezelHeight(t) + thickness) * Math.tan(theta1 - theta2);
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
  bezel: number;
  ior?: number;
  thickness?: number;
  magnify?: number;
};

// Displacement map. Output RGBA (Uint8ClampedArray, width*height*4)
export function createDisplacementMap({
  width,
  height,
  radius,
  bezel,
  ior = 1.5,
  thickness = 0.35,
  magnify = 0,
}: DisplacementMapOpts): MapResult {
  const w = Math.max(1, Math.round(width)),
    h = Math.max(1, Math.round(height));
  const r = Math.min(radius, w / 2, h / 2),
    b = Math.max(1, Math.min(bezel, r || bezel, w / 2, h / 2));

  const N = 128,
    prof = new Float32Array(N + 1);
  let peak = 0;
  for (let i = 0; i <= N; i++) {
    prof[i] = refractionAt(i / N, ior, thickness);
    peak = Math.max(peak, prof[i]);
  }
  for (let i = 0; i <= N; i++) prof[i] /= peak || 1;

  const vx = new Float32Array(w * h),
    vy = new Float32Array(w * h);
  const half = Math.min(w, h) / 2;
  let maxV = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = y * w + x,
        s = roundedRectSDF(x + 0.5, y + 0.5, w, h, r),
        inside = -s.d;
      let dx = 0,
        dy = 0;
      if (inside >= 0 && inside < b) {
        const m = prof[Math.round((inside / b) * N)];
        dx = -s.nx * m;
        dy = -s.ny * m;
      }
      if (magnify && inside >= 0) {
        dx += ((w / 2 - x) / half) * magnify;
        dy += ((h / 2 - y) / half) * magnify;
      }
      vx[k] = dx;
      vy[k] = dy;
      maxV = Math.max(maxV, Math.abs(dx), Math.abs(dy));
    }
  }

  const data = new Uint8ClampedArray(w * h * 4),
    norm = maxV > 1 ? 1 / maxV : 1;
  for (let k = 0; k < w * h; k++) {
    data[k * 4] = 128 + Math.round(vx[k] * norm * 127);
    data[k * 4 + 1] = 128 + Math.round(vy[k] * norm * 127);
    data[k * 4 + 2] = 128;
    data[k * 4 + 3] = 255;
  }
  return { data, width: w, height: h };
}

export type SpecularMapOpts = {
  width: number;
  height: number;
  radius: number;
  bezel: number;
  lightAngle?: number;
  key?: number;
  counter?: number;
  fresnel?: number;
  shininess?: number;
};

// Specular map: white with alpha = Blinn-Phong highlight
export function createSpecularMap({
  width,
  height,
  radius,
  bezel,
  lightAngle = 315,
  key = 0.9,
  counter = 0.45,
  fresnel = 0.35,
  shininess = 18,
}: SpecularMapOpts): MapResult {
  const w = Math.max(1, Math.round(width)),
    h = Math.max(1, Math.round(height));
  const r = Math.min(radius, w / 2, h / 2),
    b = Math.max(1, Math.min(bezel, r || bezel, w / 2, h / 2));
  const a = (lightAngle * Math.PI) / 180;
  const lights = [
    [Math.sin(a), -Math.cos(a), key],
    [-Math.sin(a), Math.cos(a), counter],
  ];
  const data = new Uint8ClampedArray(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = (y * w + x) * 4,
        s = roundedRectSDF(x + 0.5, y + 0.5, w, h, r),
        inside = -s.d;
      data[k] = data[k + 1] = data[k + 2] = 255;
      if (inside < 0 || inside >= b) {
        data[k + 3] = 0;
        continue;
      }
      const t = inside / b,
        slope = Math.min(6, bezelSlope(Math.max(t, 0.02)));
      let nx = s.nx * slope,
        ny = s.ny * slope,
        nz = 1;
      const nl = Math.hypot(nx, ny, nz);
      nx /= nl;
      ny /= nl;
      nz /= nl;

      let v = fresnel * Math.pow(1 - nz, 3);
      for (const [lx, ly, strength] of lights) {
        const L = [lx * 0.77, ly * 0.77, 0.64];
        const H = [L[0], L[1], L[2] + 1],
          hl = Math.hypot(H[0], H[1], H[2]);
        const ndh = Math.max(0, (nx * H[0] + ny * H[1] + nz * H[2]) / hl);
        v += strength * Math.pow(ndh, shininess) * (1 - nz) * 2;
      }
      data[k + 3] = Math.round(Math.min(1, v) * 255);
    }
  }
  return { data, width: w, height: h };
}
