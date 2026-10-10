import { useSyncExternalStore } from "react";

// Matches the mockup's `max-width: 767px` rule where menus become bottom sheets.
const PHONE_QUERY = "(max-width: 767px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True below 768px. Server render and hydration assume the desktop layout. */
export function useIsPhone() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}
