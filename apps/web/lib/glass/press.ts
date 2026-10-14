/** Press-in spring: short and critically damped, so the gel confirms the touch without overshooting. */
export const PRESS_IN = { response: 0.2, damping: 1 } as const;
/** Release: a barely visible settle, a little more for a surface that is itself the control. */
export const PRESS_OUT_SELF = { response: 0.22, damping: 0.8 } as const;
export const PRESS_OUT_CHILD = { response: 0.22, damping: 0.9 } as const;

/** Growth is capped at 3px of width, so a full-width row never overflows its sheet. */
export function pressGrow(width: number): number {
  return Math.min(0.04, 3 / Math.max(1, width));
}

/** CSS `scale` for a control inside glass at press progress `v` (0 to 1). */
export function childScale(grow: number, v: number): string {
  return String(1 + grow * v);
}

/** CSS `scale` for a surface that is itself pressed: it gels wider than tall. */
export function gelScale(grow: number, v: number): string {
  return `${1 + Math.min(0.03, grow) * v} ${1 + Math.min(0.02, grow) * v}`;
}
