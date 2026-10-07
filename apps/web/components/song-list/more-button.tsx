"use client";

import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import type { Episode, Queue, Song } from "@infinitunes/types";
import { getImageSrc, newQueueItemId, toQueue } from "@infinitunes/types";
import { buttonVariants } from "@infinitunes/ui/components/button";
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@infinitunes/ui/components/dropdown-menu";
import { Separator } from "@infinitunes/ui/components/separator";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ListMinus,
  ListMusic,
  ListOrdered,
  MoreVertical,
  Play,
  Radio,
  Share2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { getItemName } from "~/components/song-list/item-name";
import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "~/hooks/use-store";
import { unwrap } from "~/lib/action-result";
import type { User } from "~/lib/auth";
import {
  addSongsToPlaylist,
  addToFavorites,
  removeFromFavorites,
  removeSongsFromPlaylist,
} from "~/lib/db/queries";
import { api } from "~/lib/trpc/client";
import { userMessage } from "~/lib/user-message";
import { cn } from "~/lib/utils";

import { AddToPlaylistDialog } from "../playlist/add-to-playlist-dialog";
import { ShareOptions } from "../share-options";
import { ShareSubMenu } from "../share-submenu";
import { TileMoreLinks } from "./more-links";

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

function getItemUrl(item: Song | Episode | Queue): string {
  return "perma_url" in item ? item.perma_url : item.url;
}

function getItemAlbumUrl(item: Song | Episode | Queue): string | undefined {
  return "more_info" in item && item.type === "song"
    ? item.more_info.album_url
    : undefined;
}

function getItemArtists(item: Song | Episode | Queue) {
  return "more_info" in item
    ? (item.more_info.artistMap?.primary_artists ?? [])
    : item.artists;
}

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

  const [traslateX, setTranslateX] = React.useState(0);
  const [isDialogOpen, setDialogOpen] = React.useState(false);

  const [, setIsPlayerInit] = useIsPlayerInit();
  const [initialQueue, setQueue] = useQueue();
  const [, setCurrentIndex] = useCurrentSongIndex();
  const [, setActiveRadio] = useActiveRadioSession();

  const utils = api.useUtils();

  const [isFavorite, setOptimisticFavorite] = React.useOptimistic(
    favorites?.songs.includes(item.id) ?? false,
    (_current, update: boolean) => update,
  );

  function like() {
    if (!user) {
      toast.warning("Unable to perform action. Please sign in.", {
        description: "You need to sign in to like this item.",
      });
      return;
    }

    const name = getItemName(item);

    React.startTransition(async () => {
      setOptimisticFavorite(!isFavorite);
      const promise = unwrap(
        isFavorite
          ? removeFromFavorites(item.id, "song")
          : addToFavorites(item.id, "song"),
      );

      toast.promise(promise, {
        loading: isFavorite
          ? "Removing from favorites..."
          : "Adding Song to favorites...",
        success: isFavorite
          ? `Successfully removed "${name}" from favorites!`
          : `"${name}" song added to favorites!`,
        error: userMessage,
      });

      try {
        await promise;
        router.refresh();
      } catch {
        // Handled by toast.promise; transition failure reverts optimistic state
      }
    });
  }

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

  async function playRadio() {
    try {
      toast.loading("Starting radio...", { id: "song-radio" });
      const artists = getItemArtists(item);
      const primary = artists?.[0];
      const artistName = primary?.name;
      const artistId = primary?.id;

      const stationName = artistName || getItemName(item);
      const radioType: "artist" | "featured" = artistName
        ? "artist"
        : "featured";

      const { stationId } = await utils.client.radio.createStation.mutate({
        type: radioType,
        name: stationName,
        artistId,
        language:
          "language" in item && typeof item.language === "string"
            ? item.language
            : undefined,
      });

      const radioSongs = await utils.radio.songs.fetch({
        stationId,
        k: 20,
      });

      if (!radioSongs.length) {
        toast.error("Could not find songs for this radio", {
          id: "song-radio",
        });
        return;
      }

      const radioQueue = radioSongs.map(toQueue);
      setQueue(radioQueue);
      setActiveRadio({
        stationId,
        name: `${stationName} Radio`,
        type: radioType,
      });
      setCurrentIndex(0);
      setIsPlayerInit(true);

      toast.success(`Playing "${stationName} Radio"`, {
        id: "song-radio",
        description: `Added ${radioQueue.length} station tracks to queue`,
      });
    } catch {
      toast.error("Unable to start radio station", { id: "song-radio" });
    }
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

  return (
    <>
      <div className="lg:hidden">
        <Drawer>
          <DrawerTrigger
            aria-label="More Options"
            className="flex size-11 items-center justify-center rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MoreVertical
              aria-hidden="true"
              className="size-6 hover:text-primary"
            />
          </DrawerTrigger>

          <DrawerContent className="rounded-t-2xl">
            <DrawerHeader className="pb-0">
              <div className="flex items-center gap-2 truncate">
                <div className="relative aspect-square h-14 rounded-md">
                  <Image
                    src={getImageSrc(item.image, "low")}
                    alt={getItemName(item)}
                    fill
                    sizes="56px"
                    className="z-10 shrink-0 rounded-md"
                  />

                  <Skeleton className="absolute inset-0 size-full" />
                </div>

                <div className="flex flex-col justify-start truncate text-start">
                  <DrawerTitle className="truncate">
                    {getItemName(item)}
                  </DrawerTitle>
                  <DrawerDescription className="truncate">
                    {item.subtitle}
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>

            <Separator className="mb-2 mt-4" />

            <div
              className="relative flex flex-col gap-2 px-4 transition-transform duration-300"
              style={{ transform: `translateX(${traslateX}%)` }}
            >
              {menuItems
                .filter(({ hide }) => !hide)
                .map(({ icon: Icon, label, onClick }, i) => (
                  <button
                    key={i}
                    onClick={onClick}
                    className="flex h-11 items-center font-medium"
                  >
                    <Icon className="mr-2 size-5" />
                    {item.type === "song"
                      ? label
                      : label.replace("Song", "Episode")}
                  </button>
                ))}

              <button
                onClick={() => setTranslateX(-110)}
                className="flex h-11 items-center font-medium"
              >
                <Share2 className="mr-2 size-5" />
                Share
                <ChevronRight className="ml-auto size-5" />
              </button>

              <div className="absolute left-[110%] min-w-full space-y-2 bg-background">
                <button
                  onClick={() => setTranslateX(0)}
                  className="flex h-11 items-center px-4 font-medium"
                >
                  <ChevronLeft className="mr-2 size-5" />
                  Back
                </button>

                <Separator className="-my-2 mb-2" />

                <ShareOptions
                  className="flex flex-col p-4 [&_a]:flex [&_a]:min-h-11 [&_a]:items-center [&_button]:flex [&_button]:min-h-11 [&_button]:items-center"
                  title={getItemName(item)}
                />
              </div>

              <Separator />

              <TileMoreLinks
                type={item.type}
                itemUrl={getItemUrl(item)}
                albumUrl={getItemAlbumUrl(item)}
                showAlbum={item.type === "song" ? showAlbum : false}
                primaryArtists={getItemArtists(item)}
              />
            </div>

            <Separator className="my-4" />

            <DrawerFooter className="pt-0 sm:justify-center">
              <DrawerClose className={buttonVariants({ className: "h-11" })}>
                Cancel
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="hidden lg:block">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="More Options"
            className={cn(
              "rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
          >
            <MoreVertical
              aria-hidden="true"
              className="size-6 hover:text-primary"
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="left"
            align="start"
            className="*:cursor-pointer"
          >
            {menuItems
              .filter(({ hide }) => !hide)
              .map(({ icon: Icon, label, onClick }, i) => (
                <DropdownMenuItem key={i} onClick={onClick}>
                  <Icon className="mr-2 size-5" />
                  {item.type === "song"
                    ? label
                    : label.replace("Song", "Episode")}
                </DropdownMenuItem>
              ))}
            <ShareSubMenu title={getItemName(item)} />
            <DropdownMenuSeparator className="my-2" />
            <TileMoreLinks
              type={item.type}
              itemUrl={getItemUrl(item)}
              albumUrl={getItemAlbumUrl(item)}
              showAlbum={showAlbum}
              isDropdownItem
              primaryArtists={getItemArtists(item)}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!!user && (
        <AddToPlaylistDialog
          user={user}
          isDialogOpen={isDialogOpen}
          setDialogOpen={setDialogOpen}
          playlists={playlists}
          addToPlaylist={addToPlaylist}
        />
      )}
    </>
  );
}
