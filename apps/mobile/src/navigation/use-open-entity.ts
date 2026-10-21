import type { MediaType } from "@infinitunes/types";
import { router, useSegments } from "expo-router";

import { entityHref } from "./entity-href";

/**
 * Opens an item's screen from a handler (a menu action, not a `Link`).
 * Inside a tab it is pushed onto that tab's stack, keeping the screen below;
 * from the player or queue (modals over the tabs) those close first, so the
 * screen opens in the tab beneath them.
 */
export function useOpenEntity() {
  const inModal = useSegments()[0] !== "(tabs)";
  return (type: MediaType, url: string) => {
    const href = entityHref(type, url);
    if (!href) return;
    if (inModal) router.dismissAll();
    router.push(href);
  };
}
