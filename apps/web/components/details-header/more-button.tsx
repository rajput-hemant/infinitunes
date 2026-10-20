"use client";

import { userMessage } from "@infinitunes/core/user-message";
import type { MyPlaylist } from "@infinitunes/db/schema";
import type {
  MediaType,
  Quality,
  Queue,
  SongRowItem,
} from "@infinitunes/types";
import { getImageSrc, toQueue, toQueueEntry } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@infinitunes/ui/components/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@infinitunes/ui/components/dropdown-menu";
import { Separator } from "@infinitunes/ui/components/separator";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import {
  ChevronLeft,
  CloudDownload,
  ChevronRight,
  ListMusic,
  ListOrdered,
  MoreVertical,
  Radio,
  Share2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useDownloadSongs } from "~/components/download-button";
import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import type { RadioStart } from "~/components/song-list/more-button-radio";
import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "~/hooks/use-store";
import { unwrap } from "~/lib/action-result";
import { addSongsToPlaylist } from "~/lib/actions";
import type { User } from "~/lib/auth";
import { controlStyles } from "~/lib/control-styles";
import { addSongsOptimistic } from "~/lib/optimistic-playlists";
import { trpc } from "~/lib/trpc/vanilla";
import { cn } from "~/lib/utils";

import { AddToPlaylistDialog } from "../playlist/add-to-playlist-dialog";
import { ShareOptions } from "../share-options";
import { ShareSubMenu } from "../share-submenu";

type MoreButtonProps = {
  user?: User;
  type: MediaType;
  image: Quality;
  name: string;
  subtitle: string;
  songs: SongRowItem[];
  playlists?: MyPlaylist[];
  artistId?: string;
  language?: string;
};

type MenuItem = {
  label: string;
  onClick: () => void;
  hide?: boolean;
  /** The header shows its own button for this action from md up. */
  phoneOnly?: boolean;
  icon: LucideIcon;
};

type RadioSeed = {
  type: MediaType;
  name: string;
  artistId?: string;
  songs: SongRowItem[];
  language?: string;
};

/**
 * Creates a station for the album, playlist or artist and starts it. Kept
 * outside the component: the React Compiler bails out on try/catch around
 * value blocks.
 */
async function startSeedRadio(seed: RadioSeed, radio: RadioStart) {
  const { type, name, artistId: initialArtistId, songs, language } = seed;
  const { client, setQueue, setCurrentIndex, setIsPlayerInit, setActiveRadio } =
    radio;

  try {
    toast.loading("Starting radio...", { id: "play-radio" });
    let stationName = name;
    let artistId: string | undefined = initialArtistId;
    let radioType: "artist" | "featured" = "featured";

    if (type === "artist") {
      radioType = "artist";
    } else {
      const primary = songs[0]?.primaryArtists[0];
      if (primary) {
        stationName = primary.name;
        artistId = primary.id;
        radioType = "artist";
      }
    }

    const stationLanguage = language || songs[0]?.language;

    const { stationId } = await client.radio.createStation.mutate({
      type: radioType,
      name: stationName,
      artistId,
      language: stationLanguage,
    });

    const radioSongs = await client.radio.songs.query({
      stationId,
      k: 20,
    });

    if (!radioSongs.length) {
      toast.error("Could not find songs for this radio", {
        id: "play-radio",
      });
      return;
    }

    const radioQueue = radioSongs.map(toQueue);
    setQueue(radioQueue);
    setActiveRadio({
      stationId,
      name: `${stationName} Radio`,
      type: radioType,
      language: stationLanguage,
    });
    setCurrentIndex(0);
    setIsPlayerInit(true);

    toast.success(`Playing "${stationName} Radio"`, {
      id: "play-radio",
      description: `Added ${radioQueue.length} station tracks to queue`,
    });
  } catch {
    toast.error("Unable to start radio station", { id: "play-radio" });
  }
}

export function MoreButton(props: MoreButtonProps) {
  const {
    user,
    name,
    subtitle,
    type,
    image,
    songs,
    playlists,
    artistId: initialArtistId,
    language,
  } = props;

  const router = useRouter();

  const [isSharing, setIsSharing] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);

  const [, setQueue] = useQueue();
  const [, setCurrentIndex] = useCurrentSongIndex();
  const [, setIsPlayerInit] = useIsPlayerInit();
  const [, setActiveRadio] = useActiveRadioSession();

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

  async function playRadio() {
    await startSeedRadio(
      {
        type,
        name,
        artistId: initialArtistId,
        songs,
        language,
      },
      {
        client: trpc,
        setQueue,
        setCurrentIndex,
        setIsPlayerInit,
        setActiveRadio,
      },
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
      label: "Add To Playlist",
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
      hide: songs.length === 0 || isDownloading,
      phoneOnly: true,
      icon: CloudDownload,
    },
  ];

  return (
    <div>
      <div className="md:hidden">
        <Drawer onOpenChange={(open) => !open && setIsSharing(false)}>
          <DrawerTrigger
            render={
              <Button
                aria-label="More options"
                size="icon"
                variant="ghost"
                className={controlStyles.headerIcon}
              >
                <MoreVertical className="size-5" />
              </Button>
            }
          />

          <DrawerContent className="rounded-t-3xl">
            <DrawerHeader className="pb-0">
              <div className="flex gap-2 truncate">
                <div className="relative aspect-square h-14 rounded-md">
                  <ImageWithFallback
                    src={getImageSrc(image, "low")}
                    alt={name}
                    fill
                    sizes="56px"
                    fallback={getPlaceholderSrc(type)}
                    className="z-10 rounded-md"
                  />

                  <Skeleton className="absolute inset-0 size-full" />
                </div>

                <div className="flex flex-col justify-center truncate text-start">
                  <DrawerTitle className="truncate">{name}</DrawerTitle>
                  <DrawerDescription className="truncate">
                    {subtitle}
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>

            <Separator className="my-2" />

            <div
              className="relative flex min-h-[300px] flex-col gap-4 px-4 transition-transform duration-300"
              style={{ transform: `translateX(${isSharing ? -110 : 0}%)` }}
            >
              <div
                inert={isSharing}
                aria-hidden={isSharing}
                className="flex flex-col gap-4"
              >
                {menuItems
                  .filter(({ hide }) => !hide)
                  .map(({ icon: Icon, label, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      className="flex h-(--ctl-lg) items-center font-medium"
                    >
                      <Icon className="mr-2 size-5" />
                      {label}
                    </button>
                  ))}

                <button
                  onClick={() => setIsSharing(true)}
                  className="flex h-(--ctl-lg) items-center font-medium"
                >
                  <Share2 className="mr-2 size-5" />
                  Share
                  <ChevronRight className="ml-auto size-5" />
                </button>
              </div>

              <div
                inert={!isSharing}
                aria-hidden={!isSharing}
                className="absolute left-[110%] min-w-full space-y-2 bg-background"
              >
                <button
                  onClick={() => setIsSharing(false)}
                  className="flex h-(--ctl-lg) items-center px-4 font-medium"
                >
                  <ChevronLeft className="mr-2 size-5" />
                  Back
                </button>

                <Separator />

                <ShareOptions
                  className="flex flex-col gap-4 p-4"
                  title={name}
                />
              </div>
            </div>

            <Separator className="my-4" />

            <DrawerFooter className="pt-0 sm:justify-center">
              <DrawerClose
                render={
                  <Button
                    variant="outline"
                    className={cn(controlStyles.text, "w-full")}
                  >
                    Cancel
                  </Button>
                }
              />
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label="More options"
                size="icon"
                variant="ghost"
                className={controlStyles.headerIcon}
              >
                <MoreVertical className="size-5" />
              </Button>
            }
          />

          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              {menuItems
                .filter(({ hide, phoneOnly }) => !hide && !phoneOnly)
                .map(({ icon: Icon, label, onClick }) => (
                  <DropdownMenuItem
                    key={label}
                    onClick={onClick}
                    className="cursor-pointer"
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

      {!!user && (
        <AddToPlaylistDialog
          isDialogOpen={isDialogOpen}
          setDialogOpen={setDialogOpen}
          playlists={playlists}
          addToPlaylist={addToPlaylist}
        />
      )}
    </div>
  );
}
