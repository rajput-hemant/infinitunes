import { MenuView } from "@expo/ui/community/menu";
import type { MenuAction } from "@expo/ui/community/menu";
import type { PlaylistView } from "@infinitunes/core/react/optimistic-playlists";
import type { QueueSource, RowExtras } from "@infinitunes/types";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { toast } from "sonner-native";

import { downloadTrack } from "~/lib/download";
import { preferencesStore } from "~/lib/preferences";
import { shareItem } from "~/lib/share";
import { entityHref } from "~/navigation/entity-href";
import { playerStore } from "~/playback/player-store";
import { addSongToPlaylist, useUserPlaylists } from "~/user-data/playlists";
import { promptSignIn, useUserId } from "~/user-data/session";

/** A catalog row or a queue entry: what a track's menu needs. */
export type TrackItem = QueueSource & RowExtras;

/** A menu action and what it does; entries with sub-actions only open a submenu. */
type MenuEntry = Omit<MenuAction, "subactions" | "id"> & {
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
  entries: MenuEntry[],
  into = new Map<string, () => void>(),
) {
  for (const entry of entries) {
    if (entry.run) into.set(entry.id, entry.run);
    if (entry.subactions) collectRuns(entry.subactions, into);
  }
  return into;
}

function navigateTo(type: "album" | "artist", url: string) {
  const href = entityHref(type, url);
  if (!href) return;
  // From the full player (a modal) the screen opens in the tabs below it.
  if (router.canDismiss()) router.dismissAll();
  router.push(href);
}

function playlistEntries(
  song: TrackItem,
  signedIn: boolean,
  playlists: PlaylistView[] | undefined,
): MenuEntry {
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
      state: playlist.songs.includes(song.id) ? "on" : "off",
      attributes: { disabled: playlist.pending === true },
      run: () => addSongToPlaylist(playlist, song),
    })),
  };
}

function artistEntry(song: TrackItem): MenuEntry | undefined {
  const artists = song.primaryArtists ?? song.artists;
  const [only] = artists;
  if (!only) return undefined;
  const base = {
    id: "go-to-artist",
    title: "Go to Artist",
    image: "music.microphone",
  } as const;
  if (artists.length === 1) {
    return { ...base, run: () => navigateTo("artist", only.perma_url) };
  }
  return {
    ...base,
    subactions: artists.map((artist) => ({
      id: `artist:${artist.id}`,
      title: artist.name,
      run: () => navigateTo("artist", artist.perma_url),
    })),
  };
}

function download(song: TrackItem) {
  const quality = preferencesStore.getState().downloadQuality;
  toast.promise(downloadTrack(song, quality), {
    loading: `Downloading "${song.name}"...`,
    success: () => `"${song.name}" is ready`,
    error: (error) =>
      error instanceof Error ? error.message : "Download failed",
  });
}

type SongMenuProps = {
  song: TrackItem;
  /** The list's own destructive action (remove from the queue or a playlist). */
  removal?: { title: string; onRemove: () => void };
  /** The trigger; tapping it opens the native menu. */
  children: ReactNode;
};

/**
 * A track's actions in the platform menu (SwiftUI `Menu`, a Material
 * dropdown): play next, add to queue, add to playlist, go to album or
 * artist, share, download, and the list's own removal.
 */
export function SongMenu({ song, removal, children }: SongMenuProps) {
  const signedIn = useUserId() !== undefined;
  const playlists = useUserPlaylists();
  const { playNext, addToQueue } = playerStore.getState();
  const isSong = song.type === "song";

  const entries: MenuEntry[] = [
    {
      id: "play-next",
      title: "Play Next",
      image: "text.line.first.and.arrowtriangle.forward",
      run: () => playNext(song),
    },
    {
      id: "add-to-queue",
      title: "Add to Queue",
      image: "text.line.last.and.arrowtriangle.forward",
      run: () => {
        addToQueue(song);
        toast(`"${song.name}" added to queue`);
      },
    },
  ];
  if (isSong) entries.push(playlistEntries(song, signedIn, playlists));
  const { albumUrl } = song;
  if (isSong && albumUrl) {
    entries.push({
      id: "go-to-album",
      title: "Go to Album",
      image: "square.stack",
      run: () => navigateTo("album", albumUrl),
    });
  }
  const artist = artistEntry(song);
  if (artist) entries.push(artist);
  entries.push({
    id: "share",
    title: "Share",
    image: "square.and.arrow.up",
    run: () => shareItem(song),
  });
  if (isSong) {
    entries.push({
      id: "download",
      title: "Download",
      image: "arrow.down.circle",
      run: () => download(song),
    });
  }
  if (removal) {
    entries.push({
      id: "remove",
      title: removal.title,
      image: "minus.circle",
      attributes: { destructive: true },
      run: removal.onRemove,
    });
  }

  const runs = collectRuns(entries);

  return (
    <MenuView
      title={song.name}
      actions={entries.map(toMenuAction)}
      onPressAction={({ nativeEvent }) => runs.get(nativeEvent.event)?.()}
    >
      {children}
    </MenuView>
  );
}
