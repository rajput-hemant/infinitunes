import { useSyncExternalStore } from "react";

// The client snapshot never changes after hydration, so nothing ever subscribes.
const subscribeNever = () => () => {};

/** False during server render and hydration, true once the client has mounted. */
export function useIsHydrated() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}
