import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import * as React from "react";

const WIDE_QUERY = "(min-width: 1440px)";

function subscribeWide(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const isWide = () => window.matchMedia(WIDE_QUERY).matches;

/** Whether the queue docks beside the content (1440px and up). */
export function useIsWide() {
  return React.useSyncExternalStore(subscribeWide, isWide, () => false);
}

/**
 * Only the docked pane is a standing preference. Read on init (the player is
 * client-only) so the first paint already has the saved side. The same key is
 * read before first paint by `QUEUE_STEP` in `lib/theme-script.ts`, which sets
 * `data-queue` so the shell reserves the column before this mounts.
 */
const dockedOpenAtom = atomWithStorage("queue_open", true, undefined, {
  getOnInit: true,
});

/**
 * Open state of the queue pane. At 1440px and up it docks beside the content
 * and the choice persists; below that it floats over the page and starts
 * closed on every visit.
 */
export function useQueuePane() {
  const docked = useIsWide();
  const [dockedOpen, setDockedOpen] = useAtom(dockedOpenAtom);
  const [floatingOpen, setFloatingOpen] = React.useState(false);
  const open = docked ? dockedOpen : floatingOpen;

  // The shell reads this to reserve the pane's column; it is not a React prop
  // because the player sits outside the page layout. The bootstrap script may
  // have set it for a narrow viewport, so a floating pane clears it.
  React.useEffect(() => {
    const root = document.documentElement;
    if (docked && open) root.dataset.queue = "open";
    else root.removeAttribute("data-queue");
    return () => root.removeAttribute("data-queue");
  }, [docked, open]);

  return {
    docked,
    open,
    setOpen: docked ? setDockedOpen : setFloatingOpen,
  };
}
