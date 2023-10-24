import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Heart, MoreVertical } from "lucide-react";

import { Album, Artist, Playlist, ShowDetails } from "@/types";
import { cn, formatDuration, getHref, getImageSrc } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";
import { H2 } from "./ui/topography";

type Props = {
  item: Album | Playlist | Artist | ShowDetails;
};

const DetailsHeader = ({ item }: Props) => {
  return (
    <div className="mb-10 flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
      <div
        className={cn(
          "relative aspect-square w-44 overflow-hidden rounded-md border p-1 shadow-2xl dark:shadow-black md:w-64",
          item.type === "artist" && "rounded-full"
        )}
      >
        <Image
          src={getImageSrc(item.image, "high")}
          width={200}
          height={200}
          alt={item.name}
          className={cn(
            "h-full w-full rounded-md object-cover",
            item.type === "artist" && "scale-105"
          )}
        />

        <Skeleton className="absolute inset-0 -z-10" />
      </div>

      <div className="flex flex-col items-center justify-center font-medium lg:items-start lg:gap-2">
        <H2 className="line-clamp-3 flex items-center">
          {item.type !== "artist" && item.explicit && (
            <Badge className="mr-2 rounded-sm px-1.5">E</Badge>
          )}

          {item.name}

          {"is_verified" in item && item.is_verified && (
            <BadgeCheck
              fill="#3b82f6"
              className="ml-2 inline-block text-background"
            />
          )}
        </H2>

        <div className="text-sm text-muted-foreground">
          {item.type === "album" && (
            <>
              <p className="hidden lg:block">
                <span>
                  by{" "}
                  {item.artist_map.artists.map((artist, i) => (
                    <Link
                      key={artist.id}
                      href={getHref(artist.url, "artist")}
                      title={artist.name}
                      className="hover:text-foreground"
                    >
                      {artist.name}
                      {i !== item.artist_map.artists.length - 1 && ","}
                    </Link>
                  ))}
                </span>
                {" · "}
                <span>{item.song_count} Songs</span>
                {" · "}
                <span>{item.play_count.toLocaleString()} Plays</span>
                {" · "}
                <span>{formatDuration(item.duration, "mm:ss")}</span>
              </p>

              <p className="text-center lg:hidden">
                <span>
                  by{" "}
                  {item.artist_map?.artists.map((artist, i) => (
                    <Link
                      key={artist.id}
                      href={getHref(artist.url, "artist")}
                      title={artist.name}
                      className="hover:text-foreground"
                    >
                      {artist.name}
                      {i !== item.artist_map?.artists.length - 1 && ","}
                    </Link>
                  ))}
                </span>

                <span className="block">
                  <span className="capitalize">{item.type}</span>
                  {" · "}
                  <span>{item.play_count?.toLocaleString()} Plays</span>{" "}
                </span>
              </p>
            </>
          )}

          {item.type === "playlist" && (
            <p>
              <span className="capitalize">{item.subtitle}</span>
              {" · "}
              <span>
                {item.subtitle_desc
                  .reverse()
                  .map(
                    (s, i) =>
                      s + (i !== item.subtitle_desc.length - 1 ? " · " : "")
                  )}
              </span>
            </p>
          )}

          {item.type === "show" && (
            <p>
              <span>Podcast</span>
              {" · "}
              <span>{item.fan_count.toLocaleString()} Fans</span>
            </p>
          )}

          {item.type === "artist" && (
            <p>
              <span>Artist</span>
              {" · "}
              <span>{item.fan_count.toLocaleString()} Listeners</span>
            </p>
          )}
        </div>

        {item.type === "album" && (
          <p className="hidden w-fit text-sm text-muted-foreground hover:text-foreground lg:block">
            <Link href={item.label_url ?? "#"}>{item.copyright_text}</Link>
          </p>
        )}

        <div className="mt-3 flex gap-2 lg:mt-6">
          <Button className="rounded-full px-10 text-xl font-bold">Play</Button>

          <Button size="icon" variant="outline" className="rounded-full">
            <Heart className="h-6 w-6" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="rounded-full">
                <MoreVertical className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              <DropdownMenuGroup className="font-medium">
                <DropdownMenuItem className="px-4">Play Now</DropdownMenuItem>
                <DropdownMenuItem className="px-4">Radio</DropdownMenuItem>
                <DropdownMenuItem className="px-4">
                  Add to Queue
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default DetailsHeader;
