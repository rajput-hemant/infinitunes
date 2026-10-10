"use client";

import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import type { Episode, Queue, Song } from "@infinitunes/types";
import { newQueueItemId, toQueue } from "@infinitunes/types";
import {
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

import { AddToPlaylistDialog } from "~/components/playlist/add-to-playlist-dialog";
import { getItemName } from "~/components/song-list/item-name";
import {
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "~/hooks/use-store";
import { unwrap } from "~/lib/action-result";
import type { User } from "~/lib/auth";
import { addSongsToPlaylist, removeSongsFromPlaylist } from "~/lib/db/queries";
import { userMessage } from "~/lib/user-message";

import { TileMoreDesktop } from "./more-button-desktop";
import { useTileFavorite } from "./more-button-favorite";
import { getEntryLabel, type TileMoreEntry } from "./more-button-item";
import { TileMoreMobile } from "./more-button-mobile";
import { useTileRadio } from "./more-button-radio";

type TileMoreButtonProps = {
  user?: User;
  favorites?: Favorite | null;
  item: Song | Episode | Queue;
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

  const [, setIsPlayerInit] = useIsPlayerInit();
  const [initialQueue, setQueue] = useQueue();
  const [, setCurrentIndex] = useCurrentSongIndex();

  const { isFavorite, like } = useTileFavorite({ item, user, favorites });
  const playRadio = useTileRadio(item);

  function play() {
    const songIndex = initialQueue.findIndex((q) => q.id === item.id);

    if (songIndex !== -1) {
      setCurrentIndex(songIndex);
    } else {
      const queue = "more_info" in item ? toQueue(item) : item;
      setQueue([queue]);
      setCurrentIndex(0);
    }

    setIsPlayerInit(true);
  }

  function addToQueue() {
    // A queue item re-added from the player needs its own entry id.
    const queue =
      "more_info" in item
        ? toQueue(item)
        : { ...item, queueItemId: newQueueItemId() };
    setQueue((q) => [...q, queue]);

    toast(`"${getItemName(item)}" added to queue`);
  }

  function togglePlaylistDialog() {
    if (user) {
      setDialogOpen(true);
    } else {
      router.push("/login");

      toast.info("Unable to perform action", {
        description: "You need to be logged in to add to playlist",
      });
    }
  }

  function addToPlaylist(id: string, name: string) {
    toast.promise(unwrap(addSongsToPlaylist(id, [item.id])), {
      loading: "Adding songs to playlist...",
      success: `"${getItemName(item)}" added to "${name}" playlist`,
      error: userMessage,
      finally: () => setDialogOpen(false),
    });
  }

  function removeFromPlaylist() {
    if (!playlistId || playlistSongIndex === undefined) {
      return;
    }

    toast.promise(
      unwrap(removeSongsFromPlaylist(playlistId, playlistSongIndex, item.id)),
      {
        loading: "Removing from playlist...",
        success: `"${getItemName(item)}" removed from playlist`,
        error: userMessage,
        finally: () => router.refresh(),
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

      {!!user && (
        <AddToPlaylistDialog
          isDialogOpen={isDialogOpen}
          setDialogOpen={setDialogOpen}
          playlists={playlists}
          addToPlaylist={addToPlaylist}
        />
      )}
    </>
  );
}
