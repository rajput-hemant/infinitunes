"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ListMusic,
  ListOrdered,
  MoreVertical,
  Radio,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import type { LucideIcon } from "lucide-react";
import type { User } from "next-auth";
import type { MyPlaylist } from "@/lib/db/schema";
import type { Quality, Queue, Song, Type } from "@/types";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useQueue } from "@/hooks/use-store";
import { addSongsToPlaylist } from "@/lib/db/queries";
import { currentlyInDev, getImageSrc } from "@/lib/utils";
import { AddToPlaylistDialog } from "../playlist/add-to-playlist-dialog";
import { ShareOptions } from "../share-options";
import { ShareSubMenu } from "../share-submenu";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";

type MoreButtonProps = {
  user?: User;
  type: Type;
  image: Quality;
  name: string;
  subtitle: string;
  songs: Song[];
  playlists?: MyPlaylist[];
};

type MenuItem = {
  label: string;
  onClick: () => void;
  hide?: boolean;
  icon: LucideIcon;
};

export function MoreButton(props: MoreButtonProps) {
  const { user, name, subtitle, type, image, songs, playlists } = props;

  const router = useRouter();

  const [traslateX, setTranslateX] = React.useState(0);
  const [isDialogOpen, setDialogOpen] = React.useState(false);

  const [, setQueue] = useQueue();

  function addToQueue() {
    const songsPayload: Queue[] = songs.map((song) => ({
      id: song.id,
      name: song.name,
      subtitle: song.subtitle,
      url: song.url,
      type: song.type,
      image: song.image,
      download_url: song.download_url,
      artists: song.artist_map.artists,
      duration: song.duration,
    }));

    setQueue((prev) => [...prev, ...songsPayload]);

    toast(`Added ${songs.length} song${songs.length > 1 ? "s" : ""} to queue`);
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
    toast.promise(
      addSongsToPlaylist(
        id,
        songs.map(({ id }) => id)
      ),
      {
        loading: "Adding songs to playlist...",
        success: `${songs.length} song${songs.length > 1 ? "s" : ""} added to "${name}" playlist`,
        error: (error) => error.message,
        finally: () => setDialogOpen(false),
      }
    );
  }

  function playRadio() {
    currentlyInDev();
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
          <DrawerTrigger asChild>
            <Button
              aria-label="More options"
              size="icon"
              variant="outline"
              className="rounded-full shadow-sm"
            >
              <MoreVertical className="size-5" />
            </Button>
          </DrawerTrigger>

          <DrawerContent className="rounded-t-3xl">
            <DrawerHeader className="pb-0">
              <div className="flex gap-2 truncate">
                <div className="relative aspect-square h-14 rounded-md">
                  <Image
                    src={getImageSrc(image, "low")}
                    alt={name}
                    fill
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

                <ShareOptions className="flex flex-col gap-4 p-4" />
              </div>
            </div>

            <Separator className="my-4" />

            <DrawerFooter className="pt-0 sm:justify-center">
              <DrawerClose asChild>
                <Button>Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
      <div className="hidden lg:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="More options"
              size="icon"
              variant="outline"
              className="rounded-full shadow-sm"
            >
              <MoreVertical className="size-5" />
            </Button>
          </DropdownMenuTrigger>

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

              <ShareSubMenu />
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
