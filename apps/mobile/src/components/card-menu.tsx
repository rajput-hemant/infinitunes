import { isFavoriteType } from "@infinitunes/core/favorites";
import type { CardItem } from "@infinitunes/types";
import { Link, router } from "expo-router";
import type { Href } from "expo-router";
import type { ReactElement } from "react";

import { shareItem } from "~/lib/share";
import { isPlayable, playEntity, queueEntity } from "~/playback/play-entity";
import type { QueueableType } from "~/playback/play-entity";
import { songsOfEntity } from "~/playback/play-entity";
import { useFavoriteToggle } from "~/user-data/favorites";
import { addSongsToPlaylist, useUserPlaylists } from "~/user-data/playlists";
import { useUserId } from "~/user-data/session";

import { ContextLink, LINK_MENUS, LongPressMenu } from "./context-menu";
import { NativeMenu } from "./native-menu";
import type { MenuEntry } from "./native-menu";

export {
  LINK_MENUS,
  menuAccessibilityActions as cardAccessibilityActions,
} from "./context-menu";

/** Types whose card offers Shuffle (a list of songs, not one song or a station). */
const SHUFFLE_TYPES: ReadonlySet<string> = new Set([
  "album",
  "playlist",
  "mix",
  "artist",
  "label",
]);

/** Types whose songs "Add to Playlist" adds. */
const PLAYLIST_TYPES: ReadonlySet<string> = new Set([
  "album",
  "playlist",
  "mix",
]);

/** Types with a heart: the card's id is the token the favorites table stores. */
const FAVORITE_CARD_TYPES: ReadonlySet<string> = new Set(["album", "playlist"]);

/**
 * "Add to Playlist" for a card: its songs are fetched when a playlist is
 * chosen (a card holds none), so no item shows checked.
 */
function cardPlaylistEntry(
  type: QueueableType,
  url: string,
  playlists: ReturnType<typeof useUserPlaylists>,
): MenuEntry {
  return {
    id: "add-to-playlist",
    title: "Add to Playlist",
    image: "music.note.list",
    subactions: [
      ...(playlists ?? []).map((playlist): MenuEntry => ({
        id: `playlist:${playlist.id}`,
        title: playlist.name,
        attributes: { disabled: playlist.pending === true },
        run: () =>
          void songsOfEntity(type, url).then((songs) => {
            if (songs) addSongsToPlaylist(playlist, songs);
          }),
      })),
      {
        id: "new-playlist",
        title: "New Playlist",
        image: "plus",
        run: () =>
          void songsOfEntity(type, url).then((songs) => {
            if (!songs) return;
            router.push({
              pathname: "/create-playlist",
              params: { songs: songs.map((song) => song.id).join(",") },
            });
          }),
      },
    ],
  };
}

/**
 * What a card offers besides opening its item, for an album or playlist
 * Apple Music's: Play, Shuffle, Play Next, Add to Queue, Add to Playlist,
 * Favourite, Share. Other types keep what applies; empty for one nothing can
 * play.
 */
export function useCardMenuEntries(
  item: CardItem | undefined,
): readonly MenuEntry[] {
  const signedIn = useUserId() !== undefined;
  const playlists = useUserPlaylists();
  const { liked, toggle } = useFavoriteToggle({
    type: item && isFavoriteType(item.type) ? item.type : "album",
    token: item?.id ?? "",
  });
  if (!item || !isPlayable(item.type)) return [];
  const { type, url } = item;
  const entries: MenuEntry[] = [
    {
      id: "play",
      title: "Play",
      image: "play",
      run: () => void playEntity(type, url),
    },
  ];
  if (type === "radio_station") return entries;
  if (SHUFFLE_TYPES.has(type)) {
    entries.push({
      id: "shuffle",
      title: "Shuffle",
      image: "shuffle",
      run: () => void playEntity(type, url, { shuffle: true }),
    });
  }
  entries.push(
    {
      id: "play-next",
      title: "Play Next",
      image: "text.line.first.and.arrowtriangle.forward",
      run: () => void queueEntity(type, url, "next"),
    },
    {
      id: "add-to-queue",
      title: "Add to Queue",
      image: "text.line.last.and.arrowtriangle.forward",
      run: () => void queueEntity(type, url, "last"),
    },
  );
  if (signedIn && PLAYLIST_TYPES.has(type)) {
    entries.push(cardPlaylistEntry(type, url, playlists));
  }
  if (signedIn && FAVORITE_CARD_TYPES.has(type)) {
    entries.push({
      id: "favourite",
      title: liked ? "Unfavourite" : "Favourite",
      image: liked ? "heart.fill" : "heart",
      run: () => void toggle(),
    });
  }
  entries.push({
    id: "share",
    title: "Share",
    image: "square.and.arrow.up",
    run: () => shareItem(item),
  });
  return entries;
}

type CardLinkProps = {
  href: Href;
  /** The menu's title. */
  name: string;
  entries: readonly MenuEntry[];
  /** What the long press previews (iOS); omitted, the menu has no preview card. */
  item?: CardItem;
  /**
   * The card's `Pressable`; pass `onLongPress` to it. A long press then only
   * opens the menu: it never also follows the link on release.
   */
  children: (onLongPress: (() => void) | undefined) => ReactElement;
};

function ignoreLongPress() {}

/**
 * A card's link with its long-press menu (C4: cards carry no Play button).
 * A shelf holds dozens of cards, so no card keeps a native menu host of its
 * own: iOS uses the link's own context menu with a compact preview card
 * (`ContextLink`), Android mounts its menu the first time the card is long
 * pressed (`LongPressMenu`).
 */
export function CardLink({
  href,
  name,
  entries,
  item,
  children,
}: CardLinkProps) {
  if (entries.length === 0) {
    return (
      <Link href={href} asChild>
        {children(undefined)}
      </Link>
    );
  }
  return LINK_MENUS ? (
    <ContextLink
      href={href}
      entries={entries}
      preview={{
        image: item?.image ?? "",
        title: name,
        subtitle: item?.subtitle,
        // As `isRoundType` (media-card imports this module, so not shared).
        round: item?.type === "artist" || item?.type === "radio_station",
      }}
    >
      {(wrap) => wrap(children(ignoreLongPress))}
    </ContextLink>
  ) : (
    <LongPressMenu
      href={href}
      renderMenu={(ref, anchor) => (
        <NativeMenu title={name} entries={entries} ref={ref}>
          {anchor}
        </NativeMenu>
      )}
    >
      {children}
    </LongPressMenu>
  );
}
