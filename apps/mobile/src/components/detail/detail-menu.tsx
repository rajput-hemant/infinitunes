import type { FavoriteType } from "@infinitunes/core/favorites";
import { createContext, use, useEffect, useLayoutEffect, useRef } from "react";

import { useCollectionEntries } from "~/components/collection-menu";
import type { CollectionMenuSpec } from "~/components/collection-menu";
import type { MenuEntry } from "~/components/native-menu";
import { announce } from "~/lib/announce";
import { useFavoriteToggle } from "~/user-data/favorites";

/** The "more" menu a detail page puts in its native header, next to Share. */
export type HeaderMenu = { title: string; entries: readonly MenuEntry[] };

/** Set by `DetailFrame`, which builds the bar's options from it. */
export const DetailMenuContext = createContext<
  ((menu: HeaderMenu | undefined) => void) | undefined
>(undefined);

function liveEntries(
  entries: readonly MenuEntry[],
  current: () => readonly MenuEntry[],
): MenuEntry[] {
  return entries.map((entry, index) => ({
    ...entry,
    run: entry.run ? () => current()[index]?.run?.() : undefined,
    subactions: entry.subactions
      ? liveEntries(entry.subactions, () => current()[index]?.subactions ?? [])
      : undefined,
  }));
}

type DetailMenuProps = Omit<CollectionMenuSpec, "rows"> & {
  rows?: CollectionMenuSpec["rows"];
  /** The item's favourite, as the first entry (signed out it asks to sign in). */
  like?: { type: FavoriteType; token: string; linkToken?: string };
};

/**
 * Renders nothing: hands the page's menu (Like, then the collection's
 * entries) to the frame's header bar (`EntityHeader` mounts it). Outside a
 * frame it is inert.
 */
export function DetailMenu({ like, rows = [], ...spec }: DetailMenuProps) {
  const register = use(DetailMenuContext);
  const { liked, toggle } = useFavoriteToggle({
    type: like?.type ?? "song",
    token: like?.token ?? "",
    linkToken: like?.linkToken,
  });
  const collection = useCollectionEntries({ ...spec, rows });
  const entries: MenuEntry[] = [
    ...(like
      ? [
          {
            id: "favorite",
            title: liked ? `Unlike ${spec.name}` : `Like ${spec.name}`,
            image: liked ? "heart.fill" : "heart",
            run: () => {
              const nowLiked = toggle();
              if (nowLiked !== undefined) {
                announce(
                  nowLiked
                    ? `Liked ${spec.name}`
                    : `Removed ${spec.name} from liked`,
                );
              }
            },
          } satisfies MenuEntry,
        ]
      : []),
    ...collection,
  ];
  const latest = useRef(entries);
  useLayoutEffect(() => {
    latest.current = entries;
  });
  // Re-register only when the menu changes; actions read the latest committed closures.
  const key = JSON.stringify([entries, rows.map((row) => row.id)]);

  useEffect(() => {
    if (!register || entries.length === 0) return;
    register({
      title: spec.name,
      entries: liveEntries(entries, () => latest.current),
    });
    return () => register(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on `key`
  }, [register, key, spec.name]);

  return null;
}
