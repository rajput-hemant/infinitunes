import type { MenuComponentRef } from "@expo/ui/community/menu";
import type { QueueSource, RowExtras } from "@infinitunes/types";
import { useEffect, useState } from "react";
import type { ReactNode, Ref } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { downloadTrack } from "~/lib/download";
import { showFailure } from "~/lib/failure";
import {
  ensureNotificationPermission,
  notifyDownloadFailed,
} from "~/lib/notifications";
import { preferencesStore } from "~/lib/preferences";
import { shareItem } from "~/lib/share";
import { useOpenEntity } from "~/navigation/use-open-entity";
import { playerStore } from "~/playback/player-store";
import { radioSeedOf } from "~/playback/radio";
import {
  addSongsToPlaylist,
  usePlaylistMembership,
  useUserPlaylists,
} from "~/user-data/playlists";
import { useUserId } from "~/user-data/session";

import { MenuTrigger } from "./menu-trigger";
import {
  addToPlaylistEntry,
  NativeMenu,
  playRadioEntry,
  type MenuEntry,
} from "./native-menu";
import { IconButton } from "./ui/icon-button";

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
    // The notification posts only in the background; the snackbar is for now.
    showFailure(`Couldn't download ${song.name}.`);
    void notifyDownloadFailed(song.name);
  });
}

type SongMenuProps = {
  song: TrackItem;
  /** The list's own destructive action (remove from the queue or a playlist). */
  removal?: { title: string; onRemove: () => void };
  /** The trigger; tapping it opens the native menu. */
  children: ReactNode;
  /** `show()` opens the menu from code (Android only). */
  ref?: Ref<MenuComponentRef>;
};

/**
 * A track's actions in the platform menu: play next, add to queue, add to
 * playlist, play radio, its own page, go to album or artist, share,
 * download, and the
 * list's own removal.
 */
export function SongMenu({ song, removal, children, ref }: SongMenuProps) {
  const signedIn = useUserId() !== undefined;
  const playlists = useUserPlaylists();
  const membership = usePlaylistMembership();
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
              membership,
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
    <NativeMenu title={song.name} entries={entries} ref={ref}>
      {children}
    </NativeMenu>
  );
}

type SongMenuButtonProps = Omit<SongMenuProps, "children" | "ref">;

/**
 * A row's "More" button and its `SongMenu`. A list holds dozens of rows, so
 * on Android the menu (a native host, the playlist and route subscriptions)
 * mounts on the first press, as `CardLink`'s does. iOS's SwiftUI menu cannot
 * be opened from code (`show()` is a no-op), so there each row keeps its own.
 */
export function SongMenuButton({ song, removal }: SongMenuButtonProps) {
  const label = `More actions for ${song.name}`;
  return Platform.OS === "ios" ? (
    <SongMenu song={song} removal={removal}>
      <MenuTrigger label={label} />
    </SongMenu>
  ) : (
    <LazySongMenu song={song} removal={removal} label={label} />
  );
}

function LazySongMenu({
  song,
  removal,
  label,
}: SongMenuButtonProps & { label: string }) {
  const [requested, setRequested] = useState(false);
  // The menu's handle as state (a callback ref), so render never reads a ref.
  const [menu, setMenu] = useState<MenuComponentRef | null>(null);

  // The first press mounts the menu; it opens once its handle exists.
  useEffect(() => {
    if (requested) menu?.show();
  }, [requested, menu]);

  return (
    <View>
      <IconButton
        icon={{ ios: "ellipsis", android: "more_vert" }}
        label={label}
        size="md"
        onPress={() => (menu ? menu.show() : setRequested(true))}
      />
      {requested ? (
        // The anchor covers the button, so the dropdown opens at it.
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <SongMenu song={song} removal={removal} ref={setMenu}>
            <View testID="song-menu" style={styles.anchor} />
          </SongMenu>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ anchor: { flex: 1 } });
