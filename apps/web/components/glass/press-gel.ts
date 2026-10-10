import { prefersReducedMotion } from "~/lib/glass/motion";
import { OVERLAY_SELECTOR } from "~/lib/glass/overlays";
import {
  PRESS_IN,
  PRESS_OUT_CHILD,
  PRESS_OUT_SELF,
  childScale,
  gelScale,
  pressGrow,
} from "~/lib/glass/press";
import { spring } from "~/lib/glass/spring";

/** A control inside glass, or a glass surface that is itself pressable. */
const CONTROL_SELECTOR =
  'button, a, [role="button"], [role^="menuitem"], [role="option"], [data-glass-press]';
const HOST_SELECTOR = `[data-glass][data-glass-size], ${OVERLAY_SELECTOR}`;

type PressState = { progress: number; stop: (() => void) | null };
const states = new WeakMap<HTMLElement, PressState>();

function press(event: PointerEvent) {
  if (event.button > 0 || !(event.target instanceof Element)) return;
  const control = event.target.closest<HTMLElement>(CONTROL_SELECTOR);
  const host = control?.closest<HTMLElement>(HOST_SELECTOR);
  if (!control || !host) return;

  const box = host.getBoundingClientRect();
  host.style.setProperty("--g-px", `${event.clientX - box.left}px`);
  host.style.setProperty("--g-py", `${event.clientY - box.top}px`);

  const self = control === host;
  // A selector's own items do not scale: the droplet carries the feedback.
  const scales = !host.hasAttribute("data-glass-selector") || self;
  const grow = pressGrow(control.offsetWidth);
  const state = states.get(host) ?? { progress: 0, stop: null };
  states.set(host, state);

  const animate = (
    to: number,
    { response, damping }: { response: number; damping: number },
  ) => {
    const write = (value: number) => {
      state.progress = value;
      host.style.setProperty("--g-press", value.toFixed(3));
      if (!scales) return;
      control.style.scale = self
        ? gelScale(grow, value)
        : childScale(grow, value);
    };
    state.stop?.();
    if (prefersReducedMotion()) {
      write(to);
      return;
    }
    state.stop = spring({
      from: state.progress,
      to,
      response,
      damping,
      onUpdate: write,
    });
  };

  animate(1, PRESS_IN);
  const release = () => {
    window.removeEventListener("pointerup", release);
    window.removeEventListener("pointercancel", release);
    animate(0, self ? PRESS_OUT_SELF : PRESS_OUT_CHILD);
  };
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
}

/** Press feedback for glass: glow from the touch point plus a spring gel. Returns the teardown. */
export function installPressGel(): () => void {
  window.addEventListener("pointerdown", press, { passive: true });
  return () => window.removeEventListener("pointerdown", press);
}
