import type { QueueSource, RowExtras } from "@infinitunes/types";
import type { ReactNode } from "react";

import { downloadTrack } from "~/lib/download";
import {
  ensureNotificationPermission,
  notifyDownloadFailed,
} from "~/lib/notifications";
import { preferencesStore } from "~/lib/preferences";
import { shareItem } from "~/lib/share";
import { useOpenEntity } from "~/navigation/use-open-entity";
import { playerStore } from "~/playback/player-store";
import { radioSeedOf } from "~/playback/radio";
import { addSongsToPlaylist, useUserPlaylists } from "~/user-data/playlists";
import { useUserId } from "~/user-data/session";

import {
  addToPlaylistEntry,
  NativeMenu,
  playRadioEntry,
  type MenuEntry,
} from "./native-menu";

/** A catalog row or a queue entry: what a track's menu needs. */
export type TrackItem = QueueSource & RowExtras;

type OpenEntity = ReturnType<typeof useOpenEntity>;

function artistEntry(
  song: TrackItem,
  openEntity: OpenEntity,
): MenuEntry | undefined {
  const artists = song.primaryArtists ?? song.artists;
  const [only] = artists;
  if (!only) return undefined;
  const base = {
    id: "go-to-artist",
    title: "Go to Artist",
    image: "music.microphone",
  } as const;
  if (artists.length === 1) {
    return { ...base, run: () => openEntity("artist", only.perma_url) };
  }
  return {
    ...base,
    subactions: artists.map((artist) => ({
      id: `artist:${artist.id}`,
      title: artist.name,
      run: () => openEntity("artist", artist.perma_url),
    })),
  };
}

function download(song: TrackItem) {
  const quality = preferencesStore.getState().downloadQuality;
  void ensureNotificationPermission();
  void downloadTrack(song, quality).catch(() => {
    void notifyDownloadFailed(song.name);
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
 * A track's actions in the platform menu: play next, add to queue, add to
 * playlist, play radio, its own page, go to album or artist, share,
 * download, and the
 * list's own removal.
 */
export function SongMenu({ song, removal, children }: SongMenuProps) {
  const signedIn = useUserId() !== undefined;
  const playlists = useUserPlaylists();
  const openEntity = useOpenEntity();
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
      },
    },
  ];
  if (isSong) {
    entries.push(
      ...(signedIn
        ? [
            addToPlaylistEntry({
              songs: [song],
              playlists,
              onAdd: (playlist) => addSongsToPlaylist(playlist, [song]),
            }),
          ]
        : []),
      playRadioEntry(radioSeedOf([song])),
    );
  }
  entries.push({
    id: "details",
    title: isSong ? "View Song Details" : "View Episode Details",
    image: "info.circle",
    run: () => openEntity(song.type, song.url),
  });
  const { albumUrl } = song;
  if (isSong && albumUrl) {
    entries.push({
      id: "go-to-album",
      title: "Go to Album",
      image: "square.stack",
      run: () => openEntity("album", albumUrl),
    });
  }
  const artist = artistEntry(song, openEntity);
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

  return (
    <NativeMenu title={song.name} entries={entries}>
      {children}
    </NativeMenu>
  );
}
