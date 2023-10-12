import Link from "next/link";

import { Episode, Song } from "@/types";
import { cn, formatDuration, getHref } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

type Props = {
  songs: (Song | Episode)[];
} & React.HTMLAttributes<HTMLDivElement>;

const SongList = ({ songs, className, ...props }: Props) => {
  return (
    <div
      className={cn("space-y-2 text-muted-foreground", className)}
      {...props}
    >
      {songs.map((song, i) => (
        <div
          key={song.id}
          className="group flex h-12 w-full cursor-pointer items-center rounded-md border px-10 text-sm font-medium shadow transition-shadow duration-150 hover:bg-secondary hover:shadow-md"
        >
          <span className="w-[2%] truncate">{i + 1}</span>

          <span className="w-[45%] truncate group-hover:text-primary">
            {song.name}
          </span>

          <span className="w-[45%] truncate">
            <ScrollArea className="pb-1">
              {song.artist_map?.primary_artists.map((artist, i) => (
                <Link
                  key={artist.id}
                  href={getHref(artist.url, "artist")}
                  className="hover:text-foreground"
                >
                  {artist.name}
                  {i !== song.artist_map?.primary_artists.length - 1 && ", "}
                </Link>
              ))}

              <ScrollBar orientation="horizontal" className="mt-1 h-1 w-full" />
            </ScrollArea>
          </span>

          <span className="w-[8%] truncate text-end">
            {formatDuration(song.duration, "mm:ss")}
          </span>
        </div>
      ))}
    </div>
  );
};

export default SongList;
