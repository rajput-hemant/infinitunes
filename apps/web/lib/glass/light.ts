/** How far (px) from a surface's border box the pointer still tilts its rim light. */
export const LIGHT_REACH = 320;
/** Default rim light direction: top-left, in CSS gradient degrees. */
export const DEFAULT_LIGHT = 135;

export type Box = { left: number; top: number; right: number; bottom: number };
export type Point = { x: number; y: number };

/**
 * Rim gradient angle (degrees) for a surface, pointing its highlight at the
 * pointer and blending back to the default light with distance. `null` when
 * the pointer is out of reach, so the surface keeps the default light.
 */
export function lightAngle(box: Box, pointer: Point): number | null {
  const cx = (box.left + box.right) / 2;
  const cy = (box.top + box.bottom) / 2;
  const nearestX = Math.max(box.left, Math.min(pointer.x, box.right));
  const nearestY = Math.max(box.top, Math.min(pointer.y, box.bottom));
  const dist = Math.hypot(pointer.x - nearestX, pointer.y - nearestY);
  if (dist > LIGHT_REACH) return null;
  const toPointer =
    (Math.atan2(cx - pointer.x, -(cy - pointer.y)) * 180) / Math.PI;
  const weight = 1 - dist / LIGHT_REACH;
  const delta = ((toPointer - DEFAULT_LIGHT + 540) % 360) - 180;
  return DEFAULT_LIGHT + delta * weight;
}

/** Light direction from device tilt: `gamma` is left/right roll in degrees. */
export function orientationLight(gamma: number): number {
  return DEFAULT_LIGHT + Math.max(-40, Math.min(40, gamma)) * 1.2;
}
