import { useCallback, useEffect, useRef, useState } from "react";
import type { FocusEventHandler, PointerEventHandler } from "react";

import { startGlassNow } from "~/components/glass/glass-loader";

/** The attribute that marks a trigger, in the shell and in the real popup alike. */
const DEFERRED_ATTR = "data-deferred";

type Deferred<M> = {
  /** The loaded module, or `null` until its chunk has arrived. */
  mod: M | null;
  /** Starts the import (once). Safe to call from any intent signal. */
  preload: () => void;
  /** Spread on the closed trigger: hover, focus and pointer down all start the import. */
  intent: {
    onPointerEnter: PointerEventHandler;
    onPointerDown: PointerEventHandler;
    onFocus: FocusEventHandler;
  };
};

/**
 * Loads a popup's chunk on intent. The page ships a closed trigger; the first
 * hover, focus, pointer down or shortcut starts the import, and once it lands
 * the caller swaps the trigger for the real popup. `name` is the trigger's
 * `data-deferred` value: if the shell trigger had keyboard focus when the swap
 * happens, the real one takes it, so tabbing is not interrupted.
 */
export function useDeferred<M>(
  name: string,
  load: () => Promise<M>,
): Deferred<M> {
  const [mod, setMod] = useState<M | null>(null);
  const started = useRef(false);
  const refocus = useRef(false);

  const preload = useCallback(() => {
    if (started.current) return;
    started.current = true;
    // The popup's glass lens should be ready when it opens.
    startGlassNow();
    load().then(
      (loaded) => {
        refocus.current =
          document.activeElement?.getAttribute(DEFERRED_ATTR) === name;
        setMod(loaded);
      },
      () => {
        // A failed import (offline) is retried on the next intent.
        started.current = false;
      },
    );
  }, [load, name]);

  useEffect(() => {
    if (!mod || !refocus.current) return;
    refocus.current = false;
    // The swap dropped the shell's focus to the body; anything else that took it since (an open popup) wins.
    if (document.activeElement && document.activeElement !== document.body)
      return;
    document
      .querySelector<HTMLElement>(`[${DEFERRED_ATTR}="${name}"]`)
      ?.focus({ preventScroll: true });
  }, [mod, name]);

  return {
    mod,
    preload,
    intent: {
      onPointerEnter: preload,
      onPointerDown: preload,
      onFocus: preload,
    },
  };
}
