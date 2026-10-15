"use client";

import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import { toQueueEntry } from "@infinitunes/types";
import {
  Download,
  Heart,
  ListMinus,
  ListMusic,
  ListOrdered,
  Play,
  Radio,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { useDownloadSongs } from "~/components/download-button";
import { getItemName } from "~/components/song-list/item-name";
import {
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "~/hooks/use-store";
import { unwrap } from "~/lib/action-result";
import { addSongsToPlaylist, removeSongsFromPlaylist } from "~/lib/actions";
import type { User } from "~/lib/auth";
import {
  addSongsOptimistic,
  removeSongOptimistic,
} from "~/lib/optimistic-playlists";
import { userMessage } from "~/lib/user-message";

import { TileMoreDesktop } from "./more-button-desktop";
import { useTileFavorite } from "./more-button-favorite";
import {
  getEntryLabel,
  isRowItem,
  type TileMoreEntry,
  type TileMoreItem,
} from "./more-button-item";
import { TileMoreMobile } from "./more-button-mobile";
import { useTileRadio } from "./more-button-radio";

// The dialog (Base UI Dialog, playlist list) loads the first time it is opened.
const AddToPlaylistDialog = React.lazy(() =>
  import("~/components/playlist/add-to-playlist-dialog").then((m) => ({
    default: m.AddToPlaylistDialog,
  })),
);

type TileMoreButtonProps = {
  user?: User;
  favorites?: Favorite | null;
  item: TileMoreItem;
  showAlbum: boolean;
  playlists?: MyPlaylist[];
  playlistId?: string;
  playlistSongIndex?: number;
  className?: string;
};

type MenuItem = {
  label: string;
  onClick: () => void;
  hide?: boolean;
  icon: LucideIcon;
};

export function TileMoreButton(props: TileMoreButtonProps) {
  const {
    user,
    favorites,
    item,
    showAlbum,
    playlists,
    playlistId,
    playlistSongIndex,
    className,
  } = props;

  const router = useRouter();

  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [dialogUsed, setDialogUsed] = React.useState(false);

  const [, setIsPlayerInit] = useIsPlayerInit();
  const [initialQueue, setQueue] = useQueue();
  const [, setCurrentIndex] = useCurrentSongIndex();

  const { isFavorite, like } = useTileFavorite({ item, user, favorites });
  const playRadio = useTileRadio(item);
  // Catalog songs in a row only; the player's queue entry has no row credits.
  const downloadable = item.type === "song" && isRowItem(item) ? [item] : [];
  const { download } = useDownloadSongs(downloadable);

  function play() {
    const songIndex = initialQueue.findIndex((q) => q.id === item.id);

    if (songIndex !== -1) {
      setCurrentIndex(songIndex);
    } else {
      setQueue([toQueueEntry(item)]);
      setCurrentIndex(0);
    }

    setIsPlayerInit(true);
  }

  function addToQueue() {
    // Every queued entry, even a re-added one, gets its own entry id.
    const queue = toQueueEntry(item);
    setQueue((q) => [...q, queue]);

    toast(`"${getItemName(item)}" added to queue`);
  }

  function togglePlaylistDialog() {
    if (user) {
      setDialogUsed(true);
      setDialogOpen(true);
    } else {
      router.push("/login");

      toast.info("Unable to perform action", {
        description: "You need to be logged in to add to playlist",
      });
    }
  }

  function addToPlaylist(id: string, name: string) {
    // The dialog closes and the song count rises now; a failure rolls both back.
    setDialogOpen(false);
    toast.promise(
      addSongsOptimistic(id, [item.id], () =>
        unwrap(addSongsToPlaylist(id, [item.id])),
      ),
      {
        loading: "Adding songs to playlist...",
        success: `"${getItemName(item)}" added to "${name}" playlist`,
        error: userMessage,
      },
    );
  }

  function removeFromPlaylist() {
    if (!playlistId || playlistSongIndex === undefined) {
      return;
    }

    // The row hides now; the write uses the index the server will see after
    // any earlier removals, and a failure shows the row again with a toast.
    toast.promise(
      removeSongOptimistic(
        playlistId,
        item.id,
        playlists?.find((p) => p.id === playlistId)?.songs,
        (index) => unwrap(removeSongsFromPlaylist(playlistId, index, item.id)),
      ),
      {
        loading: "Removing from playlist...",
        success: `"${getItemName(item)}" removed from playlist`,
        error: userMessage,
      },
    );
  }

  const menuItems: MenuItem[] = [
    {
      label: isFavorite ? "Remove From Favourite" : "Add To Favourite",
      onClick: like,
      // null: favorites failed to load, so the liked state is unknown.
      hide: item.type !== "song" || favorites === null,
      icon: Heart,
    },
    {
      label: "Play Song Now",
      onClick: play,
      icon: Play,
    },
    {
      label: "Add to Queue",
      onClick: addToQueue,
      icon: ListOrdered,
    },
    {
      label: "Add To Playlist",
      onClick: togglePlaylistDialog,
      icon: ListMusic,
    },
    {
      label: "Remove from Playlist",
      onClick: removeFromPlaylist,
      hide:
        !playlistId || playlistSongIndex === undefined || item.type !== "song",
      icon: ListMinus,
    },
    {
      label: "Play Radio",
      onClick: playRadio,
      icon: Radio,
    },
    {
      label: "Download",
      onClick: download,
      hide: downloadable.length === 0,
      icon: Download,
    },
  ];

  const entries: TileMoreEntry[] = menuItems
    .filter(({ hide }) => !hide)
    .map(({ label, onClick, icon }) => ({
      label: getEntryLabel(item, label),
      onClick,
      icon,
    }));

  return (
    <>
      <TileMoreMobile
        item={item}
        showAlbum={showAlbum}
        entries={entries}
        className={className}
      />
      <TileMoreDesktop
        item={item}
        showAlbum={showAlbum}
        entries={entries}
        className={className}
      />

      {!!user && dialogUsed && (
        <React.Suspense fallback={null}>
          <AddToPlaylistDialog
            isDialogOpen={isDialogOpen}
            setDialogOpen={setDialogOpen}
            playlists={playlists}
            addToPlaylist={addToPlaylist}
          />
        </React.Suspense>
      )}
    </>
  );
}
