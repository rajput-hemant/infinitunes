/** Phone layouts only: the tab bar never minimizes at this width and up. */
export const TAB_MIN_BREAKPOINT = 768;
const DOWN_TO_MINIMIZE = 48;
const UP_TO_EXPAND = 24;
const TOP_ZONE = 40;

export type TabMinState = {
  lastY: number;
  /** Accumulated scroll in the current direction (px, signed). */
  acc: number;
  minimized: boolean;
};

export const INITIAL_TAB_MIN: TabMinState = {
  lastY: 0,
  acc: 0,
  minimized: false,
};

/**
 * Minimize after 48px of accumulated downward scroll past y 40; expand after
 * 24px up, back in the top zone, or on a wide viewport.
 */
export function nextTabMin(
  state: TabMinState,
  y: number,
  wide: boolean,
): TabMinState {
  const dy = y - state.lastY;
  if (wide) return { lastY: y, acc: 0, minimized: false };
  const acc = Math.sign(dy) === Math.sign(state.acc) ? state.acc + dy : dy;
  if (y < TOP_ZONE || acc < -UP_TO_EXPAND) {
    return { lastY: y, acc, minimized: false };
  }
  if (acc > DOWN_TO_MINIMIZE) return { lastY: y, acc, minimized: true };
  return { lastY: y, acc, minimized: state.minimized };
}
