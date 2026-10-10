"use client";

import type { MyPlaylist } from "@infinitunes/db/schema";
import type { Quality, Queue, Song, MediaType } from "@infinitunes/types";
import { getImageSrc, toQueue } from "@infinitunes/types";
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
  ChevronRight,
  ListMusic,
  ListOrdered,
  MoreVertical,
  Radio,
  Share2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "~/hooks/use-store";
import { unwrap } from "~/lib/action-result";
import type { User } from "~/lib/auth";
import { addSongsToPlaylist } from "~/lib/db/queries";
import { api } from "~/lib/trpc/client";
import { userMessage } from "~/lib/user-message";

import { AddToPlaylistDialog } from "../playlist/add-to-playlist-dialog";
import { ShareOptions } from "../share-options";
import { ShareSubMenu } from "../share-submenu";

type MoreButtonProps = {
  user?: User;
  type: MediaType;
  image: Quality;
  name: string;
  subtitle: string;
  songs: Song[];
  playlists?: MyPlaylist[];
  artistId?: string;
  language?: string;
};

type MenuItem = {
  label: string;
  onClick: () => void;
  hide?: boolean;
  icon: LucideIcon;
};

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

  const [traslateX, setTranslateX] = React.useState(0);
  const [isDialogOpen, setDialogOpen] = React.useState(false);

  const [, setQueue] = useQueue();
  const [, setCurrentIndex] = useCurrentSongIndex();
  const [, setIsPlayerInit] = useIsPlayerInit();
  const [, setActiveRadio] = useActiveRadioSession();

  const utils = api.useUtils();

  function addToQueue() {
    const songsPayload: Queue[] = songs.map((song) => toQueue(song));

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
    toast.promise(
      unwrap(
        addSongsToPlaylist(
          playlistId,
          songs.map((song) => song.id),
        ),
      ),
      {
        loading: "Adding songs to playlist...",
        success: `${songs.length} song${songs.length === 1 ? "" : "s"} added to "${playlistName}" playlist`,
        error: userMessage,
        finally: () => setDialogOpen(false),
      },
    );
  }

  async function playRadio() {
    try {
      toast.loading("Starting radio...", { id: "play-radio" });
      let stationName = name;
      let artistId: string | undefined = initialArtistId;
      let radioType: "artist" | "featured" = "featured";

      if (type === "artist") {
        radioType = "artist";
      } else if (
        songs[0]?.more_info &&
        typeof songs[0].more_info === "object" &&
        "artistMap" in songs[0].more_info
      ) {
        const primary = (
          songs[0].more_info.artistMap as {
            primary_artists?: { id: string; name: string }[];
          }
        )?.primary_artists?.[0];
        if (primary) {
          stationName = primary.name;
          artistId = primary.id;
          radioType = "artist";
        }
      }

      const stationLanguage = language || songs[0]?.language;

      const { stationId } = await utils.client.radio.createStation.mutate({
        type: radioType,
        name: stationName,
        artistId,
        language: stationLanguage,
      });

      const radioSongs = await utils.radio.songs.fetch({
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
  ];

  return (
    <div>
      <div className="lg:hidden">
        <Drawer>
          <DrawerTrigger
            render={
              <Button
                aria-label="More options"
                size="icon"
                variant="outline"
                className="size-11 rounded-full shadow-xs lg:size-8"
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
              style={{ transform: `translateX(${traslateX}%)` }}
            >
              {menuItems
                .filter(({ hide }) => !hide)
                .map(({ icon: Icon, label, onClick }, i) => (
                  <button
                    key={i}
                    onClick={onClick}
                    className="flex h-8 items-center font-medium"
                  >
                    <Icon className="mr-2 size-5" />
                    {label}
                  </button>
                ))}

              <button
                onClick={() => setTranslateX(-110)}
                className="flex h-8 items-center font-medium"
              >
                <Share2 className="mr-2 size-5" />
                Share
                <ChevronRight className="ml-auto size-5" />
              </button>

              <div className="absolute left-[110%] min-w-full space-y-2 bg-background">
                <button
                  onClick={() => setTranslateX(0)}
                  className="flex h-8 items-center px-4 font-medium"
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
              <DrawerClose render={<Button>Cancel</Button>} />
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
      <div className="hidden lg:block">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label="More options"
                size="icon"
                variant="outline"
                className="size-11 rounded-full shadow-xs lg:size-8"
              >
                <MoreVertical className="size-5" />
              </Button>
            }
          />

          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              {menuItems
                .filter(({ hide }) => !hide)
                .map(({ icon: Icon, label, onClick }, i) => (
                  <DropdownMenuItem
                    key={i}
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
          user={user}
          isDialogOpen={isDialogOpen}
          setDialogOpen={setDialogOpen}
          playlists={playlists}
          addToPlaylist={addToPlaylist}
        />
      )}
    </div>
  );
}
