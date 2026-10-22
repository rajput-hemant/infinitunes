import { MenuView } from "@expo/ui/community/menu";
import type { MenuAction, MenuComponentRef } from "@expo/ui/community/menu";
import type { PlaylistView } from "@infinitunes/core/react/optimistic-playlists";
import { router } from "expo-router";
import type { ReactNode, Ref } from "react";

import type { RadioSeed } from "~/playback/radio";
import { startSeededRadio } from "~/playback/radio";

/** A menu action and what it does; entries with sub-actions only open a submenu. */
export type MenuEntry = Omit<MenuAction, "subactions" | "id"> & {
  id: string;
  run?: () => void;
  subactions?: MenuEntry[];
};

function toMenuAction({
  run: _run,
  subactions,
  ...action
}: MenuEntry): MenuAction {
  return subactions
    ? { ...action, subactions: subactions.map(toMenuAction) }
    : action;
}

function collectRuns(
  entries: readonly MenuEntry[],
  into = new Map<string, () => void>(),
) {
  for (const entry of entries) {
    if (entry.run) into.set(entry.id, entry.run);
    if (entry.subactions) collectRuns(entry.subactions, into);
  }
  return into;
}

type NativeMenuProps = {
  title: string;
  entries: readonly MenuEntry[];
  /** The trigger; tapping it opens the platform menu. */
  children: ReactNode;
  /** A context menu on long press (a card); a tap then reaches the children. */
  openOnLongPress?: boolean;
  /** `show()` opens the menu from code (Android only; a no-op on iOS). */
  ref?: Ref<MenuComponentRef>;
  testID?: string;
};

/** The platform menu (SwiftUI `Menu`, a Material dropdown) over entries that carry their own action. */
export function NativeMenu({
  title,
  entries,
  children,
  openOnLongPress = false,
  ref,
  testID,
}: NativeMenuProps) {
  const runs = collectRuns(entries);
  return (
    <MenuView
      ref={ref}
      testID={testID}
      shouldOpenOnLongPress={openOnLongPress}
      title={title}
      actions={entries.map(toMenuAction)}
      onPressAction={({ nativeEvent }) => runs.get(nativeEvent.event)?.()}
    >
      {children}
    </MenuView>
  );
}

type PlaylistEntryOptions = {
  /** The songs the entry adds; a playlist holding all of them shows checked. */
  songs: readonly { id: string; name: string }[];
  /** The listener's playlists; `undefined` while loading. */
  playlists: PlaylistView[] | undefined;
  onAdd: (playlist: PlaylistView) => void;
};

/**
 * "Add to Playlist": a submenu of the listener's playlists and "New
 * Playlist" (a sheet that creates one with these songs). Signed in only:
 * callers leave it out for a signed-out listener.
 */
export function addToPlaylistEntry({
  songs,
  playlists,
  onAdd,
}: PlaylistEntryOptions): MenuEntry {
  const songIds = songs.map((song) => song.id);
  const base = {
    id: "add-to-playlist",
    title: "Add to Playlist",
    image: "music.note.list",
  } as const;
  const create: MenuEntry = {
    id: "new-playlist",
    title: "New Playlist",
    image: "plus",
    run: () =>
      router.push({
        pathname: "/create-playlist",
        params: { songs: songIds.join(",") },
      }),
  };
  if (!playlists?.length) {
    return {
      ...base,
      subactions: [
        {
          id: "no-playlists",
          title: playlists ? "No playlists yet" : "Loading playlists",
          attributes: { disabled: true },
        },
        create,
      ],
    };
  }
  return {
    ...base,
    subactions: [
      ...playlists.map((playlist): MenuEntry => ({
        id: `playlist:${playlist.id}`,
        title: playlist.name,
        state: songIds.every((id) => playlist.songs.includes(id))
          ? "on"
          : "off",
        attributes: { disabled: playlist.pending === true },
        run: () => onAdd(playlist),
      })),
      create,
    ],
  };
}

/** "Play Radio": a station seeded by an artist or a name (see `radioSeedOf`). */
export function playRadioEntry(seed: RadioSeed): MenuEntry {
  return {
    id: "play-radio",
    title: "Play Radio",
    image: "dot.radiowaves.left.and.right",
    run: () => void startSeededRadio(seed),
  };
}
