import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Heart, MoreVertical } from "lucide-react";

import { Album, Artist, Label, Playlist, ShowDetails, Song } from "@/types";
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
  item: Song | Album | Playlist | Artist | ShowDetails | Label;
};

const DetailsHeader = ({ item }: Props) => {
  return (
    <div className="mb-10 flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
      <div
        className={cn(
          "relative aspect-square w-44 overflow-hidden rounded-md border p-1 shadow-2xl dark:shadow-black md:w-64",
          (item.type === "artist" || item.type === "label") && "rounded-full"
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
          {"explicit" in item && item.explicit && (
            <Badge className="mr-2 rounded-sm px-1.5">E</Badge>
          )}

          {item.name}

          {"is_verified" in item && item.is_verified && (
            <BadgeCheck
              fill="#3b82f6"
              className="text-background ml-2 inline-block"
            />
          )}
        </H2>

        <div className="text-muted-foreground space-y-1.5 text-sm">
          {item.type === "song" && (
            <>
              <p>
                <span>
                  <Link
                    href={getHref(item.album_url, "album")}
                    className="hover:text-foreground"
                  >
                    {item.album}
                  </Link>
                </span>
                <span> by </span>
                <span>
                  {item.artist_map.primary_artists.map(
                    ({ id, name, url }, i) => (
                      <Link
                        key={id}
                        href={getHref(url, "artist")}
                        className="hover:text-foreground"
                      >
                        {name}
                        {i !== item.artist_map.primary_artists.length - 1 &&
                          ", "}
                      </Link>
                    )
                  )}
                </span>
              </p>

              <p>
                <span className="capitalize">{item.type}</span>
                {" · "}
                <span>{item.play_count.toLocaleString()} Plays</span>
                {" · "}
                <span>{formatDuration(item.duration, "mm:ss")}</span>
                {" · "}
                <span className="capitalize">{item.language}</span>
              </p>
            </>
          )}

          {item.type === "album" && (
            <>
              <p className="hidden lg:block">
                <span>
                  by{" "}
                  {item.artist_map.artists.map(({ id, name, url }, i) => (
                    <Link
                      key={id}
                      href={getHref(url, "artist")}
                      title={name}
                      className="hover:text-foreground"
                    >
                      {name}
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
                  {item.artist_map?.artists.map(({ id, name, url }, i) => (
                    <Link
                      key={id}
                      href={getHref(url, "artist")}
                      title={name}
                      className="hover:text-foreground"
                    >
                      {name}
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

          {(item.type === "song" || item.type === "album") && (
            <p className="text-muted-foreground hover:text-foreground hidden w-fit text-sm lg:block">
              <Link href={item.label_url ?? "#"}>{item.copyright_text}</Link>
            </p>
          )}

          {item.type === "label" && <p>Record Label</p>}
        </div>

        <div
          className={cn(
            "mt-3 flex gap-2 lg:mt-6",
            item.type === "label" && "hidden"
          )}
        >
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
