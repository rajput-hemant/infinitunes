import type { SongRowItem } from "@infinitunes/types";
import { View } from "react-native";
import { toast } from "sonner-native";

import { playerStore } from "~/playback/player-store";
import { radioSeedOf } from "~/playback/radio";
import type { RadioSeed } from "~/playback/radio";
import { addSongsToPlaylist, useUserPlaylists } from "~/user-data/playlists";
import { useUserId } from "~/user-data/session";

import {
  addToPlaylistEntry,
  NativeMenu,
  playRadioEntry,
  type MenuEntry,
} from "./native-menu";
import { Icon } from "./ui/icon";

type CollectionMenuProps = {
  /** The album, playlist or artist; the menu's title. */
  name: string;
  rows: readonly SongRowItem[];
  /** The station "Play Radio" starts; the first song's artist by default. */
  radio?: RadioSeed;
};

/**
 * A collection's "more" menu, `EntityHeader`'s trailing control: queue all
 * its songs next or last, add them all to a playlist, or start its radio.
 */
export function CollectionMenu({ name, rows, radio }: CollectionMenuProps) {
  const signedIn = useUserId() !== undefined;
  const playlists = useUserPlaylists();
  const songs = rows.filter((row) => row.type === "song");

  const entries: MenuEntry[] = [
    {
      id: "play-next",
      title: "Play Next",
      image: "text.line.first.and.arrowtriangle.forward",
      // Each insert lands right after the current track, so insert backwards.
      run: () => {
        const { playNext } = playerStore.getState();
        for (const row of rows.toReversed()) playNext(row);
      },
    },
    {
      id: "add-to-queue",
      title: "Add to Queue",
      image: "text.line.last.and.arrowtriangle.forward",
      run: () => {
        const { addToQueue } = playerStore.getState();
        for (const row of rows) addToQueue(row);
        toast(
          `${rows.length} ${rows.length === 1 ? "song" : "songs"} added to queue`,
        );
      },
    },
  ];
  if (songs.length > 0) {
    entries.push(
      addToPlaylistEntry({
        songs,
        signedIn,
        playlists,
        onAdd: (playlist) => addSongsToPlaylist(playlist, songs),
      }),
      playRadioEntry(radio ?? radioSeedOf(songs, name)),
    );
  }

  if (rows.length === 0) return null;
  return (
    <NativeMenu title={name} entries={entries}>
      <View
        accessibilityRole="button"
        accessibilityLabel={`More actions for ${name}`}
        className="size-ctl-lg items-center justify-center rounded-lg bg-secondary"
      >
        <Icon name={{ ios: "ellipsis", android: "more_vert" }} size={20} />
      </View>
    </NativeMenu>
  );
}
