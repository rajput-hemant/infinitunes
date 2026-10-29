import type { MenuComponentRef } from "@expo/ui/community/menu";
import type { QueueSource, RowExtras } from "@infinitunes/types";
import { useEffect, useState } from "react";
import type { ReactElement, ReactNode, Ref } from "react";
import { Platform, StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { downloadTrack } from "~/lib/download";
import { showFailure } from "~/lib/failure";
import {
  ensureNotificationPermission,
  notifyDownloadFailed,
} from "~/lib/notifications";
import { preferencesStore } from "~/lib/preferences";
import { shareItem } from "~/lib/share";
import { entityHref } from "~/navigation/entity-href";
import { useOpenCredits, useOpenEntity } from "~/navigation/use-open-entity";
import { playerStore } from "~/playback/player-store";
import { radioSeedOf } from "~/playback/radio";
import { useFavoriteToggle } from "~/user-data/favorites";
import {
  addSongsToPlaylist,
  usePlaylistMembership,
  useUserPlaylists,
} from "~/user-data/playlists";
import { useUserId } from "~/user-data/session";

import { ContextLink, LINK_MENUS, LongPressMenu } from "./context-menu";
import type { ContextPreviewProps } from "./context-preview";
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

type SongMenuOptions = {
  song: TrackItem;
  /** The list's own destructive action (remove from the queue or a playlist). */
  removal?: { title: string; onRemove: () => void };
  /** The song is already in the queue (an Up next row): no "Add to Queue", details or download. */
  inQueue?: boolean;
};

/**
 * A track's actions, Apple Music's: a quick group (Favourite, Share), then
 * play next, add to queue, add to playlist, create station, go to album and
 * artist, credits, its own page, download, and the list's own removal. The
 * "..." menu and a long press's context menu share it.
 */
export function useSongMenuEntries({
  song,
  removal,
  inQueue = false,
}: SongMenuOptions): MenuEntry[] {
  const signedIn = useUserId() !== undefined;
  const playlists = useUserPlaylists();
  const membership = usePlaylistMembership();
  const openEntity = useOpenEntity();
  const openCredits = useOpenCredits();
  const { liked, toggle } = useFavoriteToggle({ type: "song", token: song.id });
  const { playNext, addToQueue } = playerStore.getState();
  const isSong = song.type === "song";

  const quick: MenuEntry[] = [];
  // Signed out, the toggle asks the listener to sign in.
  if (isSong) {
    quick.push({
      id: "favourite",
      title: liked ? "Unfavourite" : "Favourite",
      image: liked ? "heart.fill" : "heart",
      run: () => void toggle(),
    });
  }
  quick.push({
    id: "share",
    title: "Share",
    image: "square.and.arrow.up",
    run: () => shareItem(song),
  });
  const entries: MenuEntry[] = [
    { id: "quick", title: "", quick: true, subactions: quick },
    {
      id: "play-next",
      title: "Play Next",
      image: "text.line.first.and.arrowtriangle.forward",
      run: () => playNext(song),
    },
  ];
  if (!inQueue) {
    entries.push({
      id: "add-to-queue",
      title: "Add to Queue",
      image: "text.line.last.and.arrowtriangle.forward",
      run: () => {
        addToQueue(song);
      },
    });
  }
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
      { ...playRadioEntry(radioSeedOf([song])), title: "Create Station" },
    );
  }
  const { albumUrl } = song;
  if (isSong && albumUrl) {
    entries.push({
      id: "go-to-album",
      title: "Go to Album",
      subtitle: song.album,
      image: "square.stack",
      run: () => openEntity("album", albumUrl),
    });
  }
  const artist = artistEntry(song, openEntity);
  if (artist) entries.push(artist);
  if (isSong) {
    entries.push({
      id: "credits",
      title: "View Credits",
      image: "info.circle",
      run: () => openCredits(song.url),
    });
  }
  if (!inQueue) {
    entries.push({
      id: "details",
      title: isSong ? "View Song Details" : "View Episode Details",
      image: "info.circle",
      run: () => openEntity(song.type, song.url),
    });
    if (isSong) {
      entries.push({
        id: "download",
        title: "Download",
        image: "arrow.down.circle",
        run: () => download(song),
      });
    }
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
  return entries;
}

/** What a long press on a song previews: its art, name, credits and album. */
function songPreview(song: TrackItem): ContextPreviewProps {
  return {
    image: song.image,
    title: song.name,
    subtitle: song.subtitle,
    caption: song.album,
  };
}

type SongMenuProps = Omit<SongMenuOptions, "inQueue"> & {
  /** The trigger; tapping it opens the native menu. */
  children: ReactNode;
  /** `show()` opens the menu from code (Android only). */
  ref?: Ref<MenuComponentRef>;
  style?: StyleProp<ViewStyle>;
  /** The system context menu on long press (iOS rows), not a tap. */
  openOnLongPress?: boolean;
};

/** A track's actions in the platform menu (`useSongMenuEntries`). */
export function SongMenu({
  song,
  removal,
  children,
  ref,
  style,
  openOnLongPress,
}: SongMenuProps) {
  const entries = useSongMenuEntries({ song, removal });
  return (
    <NativeMenu
      title={song.name}
      entries={entries}
      ref={ref}
      style={style}
      openOnLongPress={openOnLongPress}
    >
      {children}
    </NativeMenu>
  );
}

type SongContextLinkProps = Omit<SongMenuOptions, "inQueue"> & {
  /**
   * The row: put `wrap` around its pressable (`ListRow`'s `wrap`) and pass
   * `onLongPress` to it.
   */
  children: (
    wrap?: (pressable: ReactElement) => ReactElement,
    onLongPress?: () => void,
  ) => ReactElement;
};

/**
 * A song row's long-press menu: iOS's context menu with the song preview (a
 * tap still plays; only the preview opens the song), Android's dropdown,
 * mounted on the first long press. A long list keeps no native host per row.
 */
export function SongContextLink({
  song,
  removal,
  children,
}: SongContextLinkProps) {
  const href = entityHref(song.type, song.url);
  if (LINK_MENUS && href) {
    return (
      <IosSongContext song={song} removal={removal} href={href}>
        {children}
      </IosSongContext>
    );
  }
  return (
    <LongPressMenu
      renderMenu={(options, anchor) => (
        <SongMenu song={song} removal={removal} {...options}>
          {anchor}
        </SongMenu>
      )}
    >
      {(onLongPress) => children(undefined, onLongPress)}
    </LongPressMenu>
  );
}

function IosSongContext({
  song,
  removal,
  href,
  children,
}: SongContextLinkProps & {
  href: NonNullable<ReturnType<typeof entityHref>>;
}) {
  const entries = useSongMenuEntries({ song, removal });
  return (
    <ContextLink
      href={href}
      entries={entries}
      preview={songPreview(song)}
      tapOpens={false}
    >
      {(wrap) => children(wrap)}
    </ContextLink>
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
