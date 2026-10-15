import * as React from "react";

// Matches Tailwind `lg`: the app shell swaps the desktop sidebar for the
// sidebar sheet and MobileNav below this width.
const MOBILE_BREAKPOINT = 1024;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

// The server renders the desktop layout; the client takes over during hydration.
export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}
