"use client";

import { addSongsOptimistic } from "@infinitunes/core/react/optimistic-playlists";
import { userMessage } from "@infinitunes/core/user-message";
import { toQueueEntry } from "@infinitunes/types";
import type { Queue } from "@infinitunes/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@infinitunes/ui/components/dropdown-menu";
import {
  CloudDownload,
  ListMusic,
  ListOrdered,
  MoreVertical,
  Radio,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

import { useDownloadSongs } from "~/components/download-button";
import { MoreSheet } from "~/components/more-sheet";
import { ShareSubMenu } from "~/components/share-submenu";
import type { TileMoreEntry } from "~/components/song-list/more-button-item";
import { useRadioStart } from "~/components/song-list/more-button-radio";
import { useQueue } from "~/hooks/use-store";
import { unwrap } from "~/lib/action-result";
import { addSongsToPlaylist } from "~/lib/actions";

import { headerIconClassName } from "./header-icon";
import type { MoreButtonProps } from "./more-button";
import { headerRadioSeed } from "./radio-seed";
import { ShareButton } from "./share-button";

// The dialog (Base UI Dialog, playlist list) loads the first time it is opened.
const AddToPlaylistDialog = React.lazy(() =>
  import("~/components/playlist/add-to-playlist-dialog").then((m) => ({
    default: m.AddToPlaylistDialog,
  })),
);

export type MoreButtonPopupProps = MoreButtonProps & {
  /** The shell triggers' `data-deferred` names, so focus can follow the swap. */
  names: { share: string; mobile: string; desktop: string };
  /** The shell trigger clicked before this chunk arrived: that popup opens at once. */
  openOnMount: "share" | "mobile" | "desktop" | null;
};

type MenuItem = TileMoreEntry & {
  hide?: boolean;
  /** The header shows its own button for this action from md up. */
  phoneOnly?: boolean;
};

/**
 * The header's Share and "more" popups (Base UI Menu, Drawer and the
 * Add-to-playlist dialog), loaded on intent by `MoreButton`.
 */
export function MoreButtonPopup(props: MoreButtonPopupProps) {
  const {
    user,
    name,
    subtitle,
    type,
    image,
    songs,
    playlists,
    artistId,
    language,
    names,
    openOnMount,
  } = props;

  const router = useRouter();

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [dialogUsed, setDialogUsed] = useState(false);

  const [, setQueue] = useQueue();
  const startRadio = useRadioStart();

  const { isDownloading, download } = useDownloadSongs(songs);

  function addToQueue() {
    const songsPayload: Queue[] = songs.map(toQueueEntry);

    setQueue((prev) => [...prev, ...songsPayload]);

    toast(
      `Added ${songs.length} song${songs.length === 1 ? "" : "s"} to queue`,
    );
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

  function addToPlaylist(playlistId: string, playlistName: string) {
    // The dialog closes and the playlist's count rises now; a failure rolls both back.
    const songIds = songs.map((song) => song.id);
    setDialogOpen(false);
    toast.promise(
      addSongsOptimistic(playlistId, songIds, () =>
        unwrap(addSongsToPlaylist(playlistId, songIds)),
      ),
      {
        loading: "Adding songs to playlist...",
        success: `${songs.length} song${songs.length === 1 ? "" : "s"} added to "${playlistName}" playlist`,
        error: userMessage,
      },
    );
  }

  function playRadio() {
    return startRadio(
      headerRadioSeed({ type, name, artistId, songs, language }),
    );
  }

  const menuItems: MenuItem[] = [
    {
      label: "Add to Queue",
      onClick: addToQueue,
      hide: type === "show" || type === "artist",
      icon: ListOrdered,
    },
    {
      label: "Add to Playlist",
      onClick: togglePlaylistDialog,
      hide: type === "show" || type === "artist" || type === "episode",
      icon: ListMusic,
    },
    {
      label: "Play Radio",
      onClick: playRadio,
      hide: type === "show" || type === "mix",
      icon: Radio,
    },
    {
      label: "Download",
      onClick: download,
      hide: songs.length === 0,
      // Stays listed while a download runs, so the entry does not vanish under the finger.
      disabled: isDownloading,
      phoneOnly: true,
      icon: CloudDownload,
    },
  ];
  const visible = menuItems.filter(({ hide }) => !hide);

  return (
    <>
      <ShareButton
        title={name}
        name={names.share}
        defaultOpen={openOnMount === "share"}
      />

      <div className="md:hidden">
        <MoreSheet
          art={{ image, type }}
          title={name}
          subtitle={subtitle}
          entries={visible}
          name={names.mobile}
          defaultOpen={openOnMount === "mobile"}
          triggerClassName={headerIconClassName}
        />
      </div>

      <div className="hidden md:block">
        <DropdownMenu defaultOpen={openOnMount === "desktop"}>
          <DropdownMenuTrigger
            aria-label="More options"
            data-deferred={names.desktop}
            className={headerIconClassName}
          >
            <MoreVertical aria-hidden="true" className="size-5" />
          </DropdownMenuTrigger>

          {/* The primitive pins the popup to the trigger's width, so the labels wrap.
              Size it to the content instead, as the song row menu does. */}
          <DropdownMenuContent
            align="start"
            className="w-auto min-w-56 max-w-[min(20rem,calc(100vw-1rem))]"
          >
            <DropdownMenuGroup>
              {visible
                .filter(({ phoneOnly }) => !phoneOnly)
                .map(({ icon: Icon, label, onClick, disabled }) => (
                  <DropdownMenuItem
                    key={label}
                    onClick={onClick}
                    disabled={disabled}
                    className="cursor-pointer whitespace-nowrap"
                  >
                    <Icon className="mr-2 size-5" />
                    {label}
                  </DropdownMenuItem>
                ))}

              <ShareSubMenu title={name} />
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
