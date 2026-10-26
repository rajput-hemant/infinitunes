import type { SongRowItem } from "@infinitunes/types";

import { pickDownloadFolder, saveTracks } from "~/lib/download";
import type { SaveResult } from "~/lib/download";
import { showFailure } from "~/lib/failure";
import {
  ensureNotificationPermission,
  notifyDownloadsFinished,
} from "~/lib/notifications";
import { preferencesStore } from "~/lib/preferences";
import { playerStore } from "~/playback/player-store";
import { radioSeedOf } from "~/playback/radio";
import type { RadioSeed } from "~/playback/radio";
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

/**
 * Saves the songs into a folder the listener picks, at the download quality
 * preference; dismissing the picker does nothing.
 */
async function downloadAll(songs: readonly SongRowItem[]) {
  const folder = await pickDownloadFolder();
  if (!folder) return;
  const { downloadQuality } = preferencesStore.getState();
  void ensureNotificationPermission();
  // The notification posts only in the background; the snackbar is for now.
  const finished = (result: SaveResult) => {
    if (result.failed > 0) {
      showFailure(
        result.saved === 0
          ? "Couldn't download the songs."
          : `Couldn't download ${result.failed} of ${songs.length} songs.`,
      );
    }
    void notifyDownloadsFinished(result, songs.length);
  };
  void saveTracks(folder, songs, downloadQuality).then(finished, () =>
    // The whole job failed, so nothing was saved.
    finished({ saved: 0, failed: songs.length }),
  );
}

type CollectionMenuProps = {
  /** The album, playlist or artist; the menu's title. */
  name: string;
  rows: readonly SongRowItem[];
  /** The station "Play Radio" starts; the first song's artist by default. */
  radio?: RadioSeed;
  /** Entries after the standard ones (a song's "View Credits"). */
  extra?: readonly MenuEntry[];
};

/**
 * A collection's "more" menu, `EntityHeader`'s trailing control: queue all
 * its songs next or last, add them all to a playlist, start its radio, or
 * download them all into a folder.
 */
export function CollectionMenu({
  name,
  rows,
  radio,
  extra = [],
}: CollectionMenuProps) {
  const signedIn = useUserId() !== undefined;
  const playlists = useUserPlaylists();
  const membership = usePlaylistMembership();
  const songs = rows.filter((row) => row.type === "song");

  const entries: MenuEntry[] = [
    {
      id: "play-next",
      title: "Play Next",
      image: "text.line.first.and.arrowtriangle.forward",
      // Each insert lands right after the current track, so insert backwards.
      run: () => {
        const { playNext } = playerStore.getState();
        for (const row of [...rows].reverse()) playNext(row);
      },
    },
    {
      id: "add-to-queue",
      title: "Add to Queue",
      image: "text.line.last.and.arrowtriangle.forward",
      run: () => {
        const { addToQueue } = playerStore.getState();
        for (const row of rows) addToQueue(row);
      },
    },
  ];
  if (songs.length > 0) {
    entries.push(
      ...(signedIn
        ? [
            addToPlaylistEntry({
              songs,
              playlists,
              membership,
              onAdd: (playlist) => addSongsToPlaylist(playlist, songs),
            }),
          ]
        : []),
      playRadioEntry(radio ?? radioSeedOf(songs, name)),
      {
        id: "download-all",
        title: "Download",
        image: "arrow.down.circle",
        run: () => void downloadAll(songs),
      },
    );
  }

  entries.push(...extra);

  if (rows.length === 0) return null;
  return (
    <NativeMenu title={name} entries={entries}>
      <MenuTrigger label={`More actions for ${name}`} size="lg" />
    </NativeMenu>
  );
}
