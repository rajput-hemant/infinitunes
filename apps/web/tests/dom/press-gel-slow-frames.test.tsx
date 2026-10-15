import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { installPressGel } from "../../components/glass/press-gel";

/**
 * A press on a glass control (the player bar's Play button, the hero's Play)
 * springs `scale` with a rAF-driven spring. On a slow machine every frame hits
 * the integrator's 32ms cap; the press-in spring used to diverge there, so the
 * button grew without bound (then went NaN) and covered the page.
 */

const realRaf = globalThis.requestAnimationFrame;
const realCancel = globalThis.cancelAnimationFrame;
const realNow = performance.now.bind(performance);
let clock = 0;
let pending: ((time: number) => void) | null = null;
let uninstall = () => {};

/** Advances the fake clock by `frameMs` and runs the queued frame, if any. */
function frame(frameMs: number) {
  clock += frameMs;
  const step = pending;
  pending = null;
  step?.(clock);
}

beforeEach(() => {
  clock = 1000;
  pending = null;
  performance.now = () => clock;
  globalThis.requestAnimationFrame = (cb) => {
    pending = cb;
    return 1;
  };
  globalThis.cancelAnimationFrame = () => {
    pending = null;
  };
  uninstall = installPressGel();
});

afterEach(() => {
  uninstall();
  performance.now = realNow;
  globalThis.requestAnimationFrame = realRaf;
  globalThis.cancelAnimationFrame = realCancel;
  document.body.replaceChildren();
});

function mountControl() {
  const host = document.createElement("div");
  host.setAttribute("data-glass", "regular");
  host.setAttribute("data-glass-size", "m");
  host.getBoundingClientRect = () => new DOMRect(0, 0, 200, 60);
  const button = document.createElement("button");
  Object.defineProperty(button, "offsetWidth", { value: 40 });
  host.append(button);
  document.body.append(host);
  return button;
}

const scaleOf = (button: HTMLElement) => Number(button.style.scale);

describe("press gel on slow frames", () => {
  for (const frameMs of [16, 32, 50, 120]) {
    it(`keeps a pressed control within its growth cap at ${frameMs}ms frames`, () => {
      const button = mountControl();
      button.dispatchEvent(
        new MouseEvent("pointerdown", {
          bubbles: true,
          clientX: 5,
          clientY: 5,
        }),
      );
      for (let i = 0; i < 60; i++) {
        frame(frameMs);
        const scale = scaleOf(button);
        expect(Number.isFinite(scale)).toBe(true);
        // 3px of a 40px control is 1.075; allow a little spring overshoot.
        expect(scale).toBeGreaterThanOrEqual(0.95);
        expect(scale).toBeLessThanOrEqual(1.1);
      }

      window.dispatchEvent(new MouseEvent("pointerup"));
      for (let i = 0; i < 60; i++) {
        frame(frameMs);
        const scale = scaleOf(button);
        expect(Number.isFinite(scale) || button.style.scale === "").toBe(true);
        expect(scale).toBeLessThanOrEqual(1.1);
        expect(scale).toBeGreaterThanOrEqual(0.95);
      }
      expect(pending).toBeNull();
      expect(scaleOf(button)).toBeCloseTo(1, 2);
    });
  }
});
