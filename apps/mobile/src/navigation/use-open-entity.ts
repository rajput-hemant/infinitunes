import type { MediaType } from "@infinitunes/types";
import { router, useSegments } from "expo-router";
import type { Href } from "expo-router";

import { creditsHref, entityHref } from "./entity-href";

/**
 * Opens an item's screen from a handler (a menu action, not a `Link`).
 * Inside a tab it is pushed onto that tab's stack, keeping the screen below;
 * from the player or queue (modals over the tabs) those close first, so the
 * screen opens in the tab beneath them.
 */
export function useOpenEntity() {
  const open = useOpenHref();
  return (type: MediaType, url: string) => open(entityHref(type, url));
}

/** Opens a song's Credits screen, the same way. */
export function useOpenCredits() {
  const open = useOpenHref();
  return (url: string) => open(creditsHref(url));
}

function useOpenHref() {
  const inModal = useSegments()[0] !== "(tabs)";
  return (href: Href | undefined) => {
    if (!href) return;
    if (inModal) router.dismissAll();
    router.push(href);
  };
}
