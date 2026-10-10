import { lightAngle, orientationLight } from "~/lib/glass/light";
import type { Point } from "~/lib/glass/light";
import { prefersReducedMotion } from "~/lib/glass/motion";

import { forEachGlass } from "./lens-registry";

/**
 * Tilts every surface's rim light toward the mouse (`--g-light`), and the
 * whole page's with device roll. One listener, one rAF per burst; surfaces
 * are measured first and written second so nothing thrashes layout. Returns
 * the teardown.
 */
export function installPointerLight(): () => void {
  // On <body>, not <html>: the runtime watches <html>'s style attribute for tuning changes.
  const page = document.body;
  let pointer: Point | null = null;
  let frame = 0;
  const lit = new WeakSet<HTMLElement>();

  const update = () => {
    frame = 0;
    if (!pointer) return;
    const at = pointer;
    const writes: [HTMLElement, number | null][] = [];
    forEachGlass((el, target) => {
      if (target.size === "xl") return;
      const box = el.getBoundingClientRect();
      const angle = lightAngle(box, at);
      if (angle === null && !lit.has(el)) return;
      writes.push([el, angle]);
    });
    for (const [el, angle] of writes) {
      if (angle === null) {
        el.style.removeProperty("--g-light");
        lit.delete(el);
      } else {
        el.style.setProperty("--g-light", `${angle.toFixed(1)}deg`);
        lit.add(el);
      }
    }
  };

  const onPointer = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    pointer = { x: event.clientX, y: event.clientY };
    if (!frame) frame = requestAnimationFrame(update);
  };

  const onOrientation = (event: DeviceOrientationEvent) => {
    if (event.gamma === null || prefersReducedMotion()) return;
    page.style.setProperty(
      "--g-light",
      `${orientationLight(event.gamma).toFixed(1)}deg`,
    );
  };

  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("deviceorientation", onOrientation, {
    passive: true,
  });
  return () => {
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("deviceorientation", onOrientation);
    cancelAnimationFrame(frame);
    page.style.removeProperty("--g-light");
  };
}
