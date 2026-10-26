import type { MenuComponentRef } from "@expo/ui/community/menu";
import type { Queue, RowExtras } from "@infinitunes/types";
import { Link } from "expo-router";
import type { ComponentProps, ReactElement } from "react";
import { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import type { AccessibilityActionEvent } from "react-native";

import { LINK_MENUS } from "~/components/card-menu";
import { ListRow } from "~/components/list-row";
import {
  addToPlaylistEntry,
  NativeMenu,
  playRadioEntry,
} from "~/components/native-menu";
import type { MenuEntry } from "~/components/native-menu";
import { Artwork } from "~/components/ui/artwork";
import { Text, TextInkContext } from "~/components/ui/text";
import { longPress } from "~/lib/haptics";
import { shareItem } from "~/lib/share";
import { entityHref } from "~/navigation/entity-href";
import { useOpenCredits, useOpenEntity } from "~/navigation/use-open-entity";
import { playerStore } from "~/playback/player-store";
import { radioSeedOf } from "~/playback/radio";
import { art, space } from "~/theme/tokens";
import { useFavoriteToggle } from "~/user-data/favorites";
import {
  addSongsToPlaylist,
  usePlaylistMembership,
  useUserPlaylists,
} from "~/user-data/playlists";
import { useUserId } from "~/user-data/session";

/** A menu entry that may carry a second line (iOS context menus show it). */
type Entry = MenuEntry & { subtitle?: string };

/** A queue entry and the row extras its menu reads (the album). */
type QueueTrack = Queue & RowExtras;

/** An SF Symbol name, as `Link.MenuAction` types it. */
type LinkIcon = ComponentProps<typeof Link.MenuAction>["icon"];

/**
 * A queue row's long-press menu, Apple Music's: a row of quick actions (Add
 * to Queue, Favourite, Share), then Play Next, Add to Playlist, Create
 * Station, Go to Album, View Credits and Remove from Queue.
 */
function useQueueRowMenu(song: QueueTrack, onRemove: () => void) {
  const signedIn = useUserId() !== undefined;
  const playlists = useUserPlaylists();
  const membership = usePlaylistMembership();
  const openEntity = useOpenEntity();
  const openCredits = useOpenCredits();
  const { liked, toggle } = useFavoriteToggle({ type: "song", token: song.id });
  const isSong = song.type === "song";
  const { playNext, addToQueue } = playerStore.getState();

  const quick: Entry[] = [
    {
      id: "add-to-queue",
      title: "Add",
      image: "plus.circle",
      run: () => addToQueue(song),
    },
  ];
  if (isSong)
    quick.push({
      id: "favourite",
      title: liked ? "Unfavourite" : "Favourite",
      image: liked ? "heart.fill" : "heart",
      run: () => void toggle(),
    });
  quick.push({
    id: "share",
    title: "Share",
    image: "square.and.arrow.up",
    run: () => shareItem(song),
  });
  const more: Entry[] = [
    {
      id: "play-next",
      title: "Play Next",
      image: "text.line.first.and.arrowtriangle.forward",
      run: () => playNext(song),
    },
  ];
  if (isSong) {
    if (signedIn)
      more.push(
        addToPlaylistEntry({
          songs: [song],
          playlists,
          membership,
          onAdd: (playlist) => addSongsToPlaylist(playlist, [song]),
        }),
      );
    more.push({
      ...playRadioEntry(radioSeedOf([song])),
      title: "Create Station",
    });
    const { albumUrl, album } = song;
    if (albumUrl)
      more.push({
        id: "go-to-album",
        title: "Go to Album",
        subtitle: album,
        image: "square.stack",
        run: () => openEntity("album", albumUrl),
      });
    more.push({
      id: "credits",
      title: "View Credits",
      image: "info.circle",
      run: () => openCredits(song.url),
    });
  }
  more.push({
    id: "remove",
    title: "Remove from Queue",
    image: "minus.circle",
    attributes: { destructive: true },
    run: onRemove,
  });
  return { quick, more };
}

/** Every entry with an action, submenus' included, flattened. */
function runnable(entries: readonly Entry[]): Entry[] {
  return entries.flatMap((entry) =>
    entry.subactions ? runnable(entry.subactions) : entry.run ? [entry] : [],
  );
}

/** The menu's entries as screen reader actions on the row (what a long press offers). */
function rowActions(entries: readonly Entry[]) {
  const actions = runnable(entries).filter(
    // The playlist list is long and lives in its submenu: one action opens nothing.
    (entry) => entry.id !== "new-playlist" && !entry.id.startsWith("playlist:"),
  );
  return {
    accessibilityActions: actions.map(({ id, title }) => ({
      name: id,
      label: title,
    })),
    onAccessibilityAction: ({ nativeEvent }: AccessibilityActionEvent) =>
      actions.find(({ id }) => id === nativeEvent.actionName)?.run?.(),
  };
}

/** Entries as the link's context menu items (iOS). */
function LinkEntries({ entries }: { entries: readonly Entry[] }) {
  return entries.map((entry) =>
    entry.subactions ? (
      <Link.Menu
        key={entry.id}
        title={entry.title}
        icon={entry.image as LinkIcon}
      >
        <LinkEntries entries={entry.subactions} />
      </Link.Menu>
    ) : (
      <Link.MenuAction
        key={entry.id}
        icon={entry.image as LinkIcon}
        subtitle={entry.subtitle}
        destructive={entry.attributes?.destructive}
        disabled={entry.attributes?.disabled}
        onPress={entry.run}
      >
        {entry.title}
      </Link.MenuAction>
    ),
  );
}

/** The context menu's preview: the art, title, artist and album, on the system's surface. */
function QueuePreview({ song }: { song: QueueTrack }) {
  return (
    // The row sits on the player's wash; the preview is on the system's own surface.
    <TextInkContext value={null}>
      <View className="flex-row items-center gap-4 p-4">
        <Artwork image={song.image} size="feature" />
        <View className="flex-1 gap-1">
          <Text variant="headline" numberOfLines={2}>
            {song.name}
          </Text>
          <Text tone="muted" numberOfLines={1}>
            {song.subtitle}
          </Text>
          {song.album ? (
            <Text variant="footnote" tone="muted" numberOfLines={2}>
              {song.album}
            </Text>
          ) : null}
        </View>
      </View>
    </TextInkContext>
  );
}

type QueueRowProps = {
  song: QueueTrack;
  onPress: () => void;
  onRemove: () => void;
};

/**
 * An Up next row: the song, and nothing at its end but the caller's drag
 * handle. A long press on it opens the song's context menu: iOS's with a
 * preview (the link's own context menu; a tap still plays, the preview
 * opens the song), Android's dropdown, mounted on the first long press as a
 * card's is. Its entries are also the row's screen reader actions.
 */
export function QueueRow({ song, onPress, onRemove }: QueueRowProps) {
  const { quick, more } = useQueueRowMenu(song, onRemove);
  const { width } = useWindowDimensions();
  const href = entityHref(song.type, song.url);
  const entries = [...quick, ...more];

  const row = (
    wrap?: (pressable: ReactElement) => ReactElement,
    onLongPress?: () => void,
  ) => (
    <ListRow
      title={song.name}
      subtitle={song.subtitle}
      explicit={song.explicit}
      leading={{ artwork: song.image }}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel={song.name}
      accessibilityValue={{
        text: [song.explicit && "Explicit", song.subtitle]
          .filter(Boolean)
          .join(", "),
      }}
      accessibilityHint="Plays this song"
      {...rowActions(entries)}
      wrap={wrap}
    />
  );

  if (LINK_MENUS && href) {
    return row((pressable) => (
      <Link
        href={href}
        asChild
        // The row plays; only the preview opens the song.
        onPress={(event) => event.preventDefault()}
      >
        <Link.Trigger>{pressable}</Link.Trigger>
        <Link.Preview
          style={{
            width: width - 2 * space.lg,
            height: art.feature + 2 * space.lg,
          }}
        >
          <QueuePreview song={song} />
        </Link.Preview>
        <Link.Menu title="">
          <Link.Menu title="" inline elementSize="small">
            <LinkEntries entries={quick} />
          </Link.Menu>
          <LinkEntries entries={more} />
        </Link.Menu>
      </Link>
    ));
  }
  // The dropdown has no second line: a subtitle stays out of its actions.
  const plain = entries.map(({ subtitle: _subtitle, ...entry }) => entry);
  return <AndroidQueueRow title={song.name} entries={plain} row={row} />;
}

/** Android (and anything without link menus): the dropdown mounts on the first long press. */
function AndroidQueueRow({
  title,
  entries,
  row,
}: {
  title: string;
  entries: readonly Entry[];
  row: (wrap: undefined, onLongPress: () => void) => ReactElement;
}) {
  const [requested, setRequested] = useState(false);
  // The menu's handle as state (a callback ref), so render never reads a ref.
  const [menu, setMenu] = useState<MenuComponentRef | null>(null);
  useEffect(() => {
    if (requested) menu?.show();
  }, [requested, menu]);

  function open() {
    longPress();
    if (menu) menu.show();
    else setRequested(true);
  }

  return (
    <View>
      {row(undefined, open)}
      {requested ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <NativeMenu title={title} entries={entries} ref={setMenu}>
            <View testID="queue-row-menu" style={styles.anchor} />
          </NativeMenu>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ anchor: { flex: 1 } });
