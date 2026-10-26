import { createContext, use, useEffect } from "react";

import { useCollectionEntries } from "~/components/collection-menu";
import type { CollectionMenuSpec } from "~/components/collection-menu";
import type { MenuEntry } from "~/components/native-menu";

/** The "more" menu a detail page puts in its native header, next to Share. */
export type HeaderMenu = { title: string; entries: readonly MenuEntry[] };

/** Set by `DetailFrame`, which builds the bar's options from it. */
export const DetailMenuContext = createContext<
  ((menu: HeaderMenu | undefined) => void) | undefined
>(undefined);

/**
 * Renders nothing: hands the collection's menu to the frame's header bar
 * (`EntityHeader` mounts it from its `menu` prop). Outside a frame it is
 * inert.
 */
export function DetailMenu(spec: CollectionMenuSpec) {
  const register = use(DetailMenuContext);
  const entries = useCollectionEntries(spec);
  // shortcut: re-registers on what the menu shows (JSON drops the `run`s) and
  // its rows' ids, not on closure identity; upgrade if a run reads other state.
  const key = JSON.stringify([entries, spec.rows.map((row) => row.id)]);

  useEffect(() => {
    if (!register || entries.length === 0) return;
    register({ title: spec.name, entries });
    return () => register(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on `key`
  }, [register, key, spec.name]);

  return null;
}
