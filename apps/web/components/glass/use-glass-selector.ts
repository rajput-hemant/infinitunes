"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

import { prefersReducedMotion } from "~/lib/glass/motion";
import {
  DRAG_START_PX,
  dragBounds,
  nearestItem,
  releaseVelocity,
} from "~/lib/glass/selector";
import type { ItemSpan } from "~/lib/glass/selector";
import { project, rubber, spring } from "~/lib/glass/spring";

import { registerGlass } from "./lens-registry";

const ITEM = ":scope > [data-glass-item]";
const INDICATOR = ":scope > [data-glass-indicator]";
const ACTIVE =
  '[aria-current]:not([aria-current="false"]), [aria-selected="true"], [aria-pressed="true"], [data-active="true"], [data-state="on"]';
/** Lifted droplet scale. */
const LIFT_SCALE = 1.14;

const span = (el: HTMLElement): ItemSpan => ({
  left: el.offsetLeft,
  width: el.offsetWidth,
});

/**
 * Drives a selection indicator: slides it to the active item with a spring,
 * and lets the user press, drag (rubber band past the ends) and fling it, with
 * momentum projection. While pressed or dragged it lifts into a magnifying
 * droplet. The host marks itself `data-glass-selector`, its items
 * `data-glass-item` and the indicator `data-glass-indicator`; the active item
 * is `aria-current`, `aria-selected`, `aria-pressed` or `data-active`.
 * `onPick` commits a drag release; the default clicks the item.
 */
export function useGlassSelector(
  hostRef: RefObject<HTMLElement | null>,
  onPick?: (item: HTMLElement) => void,
) {
  useEffect(() => {
    const host = hostRef.current;
    const indicator = host?.querySelector<HTMLElement>(INDICATOR);
    if (!host || !indicator) return;

    let x = 0;
    let width = 0;
    let previousX: number | null = null;
    let dragging = false;
    let stop: (() => void) | null = null;

    const items = () => [...host.querySelectorAll<HTMLElement>(ITEM)];
    const place = (nextX: number, nextWidth: number) => {
      x = nextX;
      width = nextWidth;
      indicator.style.width = `${nextWidth}px`;
      const lifted = indicator.hasAttribute("data-lifted");
      indicator.style.transform =
        `translateX(${nextX}px)` + (lifted ? ` scale(${LIFT_SCALE})` : "");
    };
    const lift = (on: boolean) => {
      if (on) indicator.setAttribute("data-lifted", "true");
      else indicator.removeAttribute("data-lifted");
      place(x, width);
    };

    const layout = () => {
      const active = items().find((item) => item.matches(ACTIVE));
      if (!active) {
        indicator.style.opacity = "0";
        return;
      }
      indicator.style.opacity = "";
      indicator.style.top = `${active.offsetTop}px`;
      indicator.style.height = `${active.offsetHeight}px`;
      if (dragging) return;
      const to = span(active);
      const slide =
        previousX !== null &&
        Math.abs(previousX - to.left) > 1 &&
        !prefersReducedMotion();
      previousX = to.left;
      stop?.();
      if (!slide) {
        place(to.left, to.width);
        return;
      }
      const [fromX, fromW] = [x, width];
      stop = spring({
        from: 0,
        to: 1,
        response: 0.38,
        damping: 0.82,
        onUpdate: (k) =>
          place(fromX + (to.left - fromX) * k, fromW + (to.width - fromW) * k),
      });
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button > 0 || !(event.target instanceof Element)) return;
      const list = items();
      if (list.length === 0) return;
      const pressed = event.target.closest<HTMLElement>("[data-glass-item]");
      const startX = event.clientX;
      const originX = x;
      const samples: [number, number][] = [[event.clientX, event.timeStamp]];
      if (pressed?.matches(ACTIVE)) lift(true);

      const move = (ev: PointerEvent) => {
        if (ev.pointerId !== event.pointerId) return;
        const dx = ev.clientX - startX;
        if (!dragging) {
          if (Math.abs(dx) < DRAG_START_PX) return;
          dragging = true;
          stop?.();
          try {
            host.setPointerCapture(event.pointerId);
          } catch {
            // Capture can fail if the pointer is already gone; the drag still tracks.
          }
          lift(true);
        }
        const { min, max } = dragBounds(list.map(span), width);
        let next = originX + dx;
        if (next < min) next = min - rubber(min - next, host.offsetWidth);
        if (next > max) next = max + rubber(next - max, host.offsetWidth);
        place(next, width);
        samples.push([ev.clientX, ev.timeStamp]);
        if (samples.length > 5) samples.shift();
      };

      const up = (ev: PointerEvent) => {
        if (ev.pointerId !== event.pointerId) return;
        host.removeEventListener("pointermove", move);
        host.removeEventListener("pointerup", up);
        host.removeEventListener("pointercancel", up);
        if (!dragging) {
          setTimeout(() => lift(false), 180);
          return;
        }
        try {
          host.releasePointerCapture(event.pointerId);
        } catch {
          // Already released.
        }
        const velocity = releaseVelocity(samples);
        const spans = list.map(span);
        const rest = x + width / 2 + project(velocity, 0.99);
        const pick = list[nearestItem(spans, rest)];
        const to = span(pick);
        const [fromX, fromW] = [x, width];
        stop = spring({
          from: 0,
          to: 1,
          velocity: to.left !== fromX ? velocity / (to.left - fromX) : 0,
          response: 0.35,
          damping: 0.8,
          onUpdate: (k) =>
            place(
              fromX + (to.left - fromX) * k,
              fromW + (to.width - fromW) * k,
            ),
          onDone: () => {
            dragging = false;
            lift(false);
          },
        });
        previousX = to.left;
        // The release would click whatever is under the pointer; commit the pick instead.
        const swallow = (click: MouseEvent) => {
          click.stopImmediatePropagation();
          click.preventDefault();
        };
        window.addEventListener("click", swallow, {
          capture: true,
          once: true,
        });
        setTimeout(
          () => window.removeEventListener("click", swallow, { capture: true }),
          80,
        );
        if (!pick.matches(ACTIVE)) {
          setTimeout(() => (onPick ? onPick(pick) : pick.click()), 90);
        }
      };

      host.addEventListener("pointermove", move);
      host.addEventListener("pointerup", up);
      host.addEventListener("pointercancel", up);
    };

    const unregister = registerGlass(indicator, { size: "s", magnify: true });
    layout();
    const resize = new ResizeObserver(layout);
    resize.observe(host);
    const mutations = new MutationObserver(layout);
    mutations.observe(host, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        "aria-current",
        "aria-selected",
        "aria-pressed",
        "data-active",
        "data-state",
      ],
    });
    host.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      stop?.();
      resize.disconnect();
      mutations.disconnect();
      host.removeEventListener("pointerdown", onPointerDown);
      unregister();
    };
  }, [hostRef, onPick]);
}
