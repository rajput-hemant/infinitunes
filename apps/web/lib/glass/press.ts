/** Press-in spring: critically damped so the gel does not overshoot on the way down. */
export const PRESS_IN = { response: 0.3, damping: 1 } as const;
/** Release: a visible wobble for a surface that is itself the control, less for a child. */
export const PRESS_OUT_SELF = { response: 0.3, damping: 0.55 } as const;
export const PRESS_OUT_CHILD = { response: 0.3, damping: 0.75 } as const;

/** Growth is capped at 6px of width, so a full-width row never overflows its sheet. */
export function pressGrow(width: number): number {
  return Math.min(0.08, 6 / Math.max(1, width));
}

/** CSS `scale` for a control inside glass at press progress `v` (0 to 1). */
export function childScale(grow: number, v: number): string {
  return String(1 + grow * v);
}

/** CSS `scale` for a surface that is itself pressed: it gels wider than tall. */
export function gelScale(grow: number, v: number): string {
  return `${1 + Math.min(0.06, grow) * v} ${1 + Math.min(0.04, grow) * v}`;
}
