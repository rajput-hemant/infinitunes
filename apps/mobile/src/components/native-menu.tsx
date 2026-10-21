import { MenuView } from "@expo/ui/community/menu";
import type { MenuAction } from "@expo/ui/community/menu";
import type { PlaylistView } from "@infinitunes/core/react/optimistic-playlists";
import type { ReactNode } from "react";

import type { RadioSeed } from "~/playback/radio";
import { startSeededRadio } from "~/playback/radio";
import { promptSignIn } from "~/user-data/session";

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
};

/** The platform menu (SwiftUI `Menu`, a Material dropdown) over entries that carry their own action. */
export function NativeMenu({ title, entries, children }: NativeMenuProps) {
  const runs = collectRuns(entries);
  return (
    <MenuView
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
  songIds: readonly string[];
  signedIn: boolean;
  /** The listener's playlists; `undefined` while loading. */
  playlists: PlaylistView[] | undefined;
  onAdd: (playlist: PlaylistView) => void;
};

/** "Add to Playlist": a submenu of the listener's playlists, or a sign-in prompt. */
export function addToPlaylistEntry({
  songIds,
  signedIn,
  playlists,
  onAdd,
}: PlaylistEntryOptions): MenuEntry {
  const base = {
    id: "add-to-playlist",
    title: "Add to Playlist",
    image: "music.note.list",
  } as const;
  if (!signedIn) {
    return {
      ...base,
      run: () => promptSignIn("You need an account to make playlists."),
    };
  }
  if (!playlists?.length) {
    return {
      ...base,
      subactions: [
        {
          id: "no-playlists",
          title: playlists ? "No playlists yet" : "Loading playlists",
          attributes: { disabled: true },
        },
      ],
    };
  }
  return {
    ...base,
    subactions: playlists.map((playlist) => ({
      id: `playlist:${playlist.id}`,
      title: playlist.name,
      state: songIds.every((id) => playlist.songs.includes(id)) ? "on" : "off",
      attributes: { disabled: playlist.pending === true },
      run: () => onAdd(playlist),
    })),
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
