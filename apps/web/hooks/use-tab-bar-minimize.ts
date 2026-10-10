"use client";

import { useEffect } from "react";

import {
  INITIAL_TAB_MIN,
  TAB_MIN_BREAKPOINT,
  nextTabMin,
} from "~/lib/glass/tab-min";
import type { TabMinState } from "~/lib/glass/tab-min";

const TAB_BAR = '[data-glass-role="tabbar"]';

/** True for keyboard focus; a tap or click focus must not hold the bar open. */
function hasKeyboardFocusWithin(bar: Element | null): boolean {
  const active = document.activeElement;
  if (!bar || !active || !bar.contains(active)) return false;
  try {
    return active.matches(":focus-visible");
  } catch {
    return false;
  }
}

/**
 * Minimizes the phone tab bar while scrolling down: 48px of accumulated
 * downward scroll past y 40 collapses it to the current tab and slides the
 * player into the freed row; 24px up, the top of the page, a tap on the
 * minimized bar or keyboard focus entering it expands it, and it stays
 * expanded while keyboard focus is inside it (the hidden tabs are otherwise
 * unreachable). Sets `html[data-tab-min="true"]`, which
 * `styles/glass.css` keys the `tabbar` and `player` roles on. A no-op from
 * 768px up. Call once from the tab bar component; no React state, no
 * per-frame work beyond one passive scroll listener.
 */
export function useTabBarMinimize() {
  useEffect(() => {
    const root = document.documentElement;
    const wide = window.matchMedia(`(min-width: ${TAB_MIN_BREAKPOINT}px)`);
    let state: TabMinState = { ...INITIAL_TAB_MIN, lastY: window.scrollY };

    const commit = (requested: TabMinState) => {
      const next =
        requested.minimized &&
        hasKeyboardFocusWithin(document.querySelector(TAB_BAR))
          ? { ...requested, minimized: false }
          : requested;
      state = next;
      if (next.minimized) root.setAttribute("data-tab-min", "true");
      else root.removeAttribute("data-tab-min");
    };

    const onScroll = () =>
      commit(nextTabMin(state, window.scrollY, wide.matches));
    const onWidthChange = () =>
      commit(nextTabMin(state, window.scrollY, wide.matches));

    // A tap on the minimized bar expands it instead of re-navigating.
    const onClick = (event: MouseEvent) => {
      if (!state.minimized) return;
      if (
        !(event.target instanceof Element) ||
        !event.target.closest(TAB_BAR)
      ) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      commit({ ...state, acc: 0, minimized: false });
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!state.minimized || !(event.target instanceof Element)) return;
      const bar = event.target.closest(TAB_BAR);
      if (bar && hasKeyboardFocusWithin(bar)) {
        commit({ ...state, acc: 0, minimized: false });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("click", onClick, true);
    window.addEventListener("focusin", onFocusIn);
    wide.addEventListener("change", onWidthChange);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("focusin", onFocusIn);
      wide.removeEventListener("change", onWidthChange);
      root.removeAttribute("data-tab-min");
    };
  }, []);
}
