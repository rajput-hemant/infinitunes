import React from "react";
import Link from "next/link";
import { Disc, Mic2, Music } from "lucide-react";

import type { ArtistMini } from "@/types";

import { getHref } from "@/lib/utils";
import { DropdownMenuItem } from "../ui/dropdown-menu";

type Props = {
  type: "song" | "episode";
  itemUrl: string;
  albumUrl?: string;
  showAlbum: boolean;
  isDropdownItem?: boolean;
  primaryArtists?: ArtistMini[];
};

export const TileMoreLinks = ({
  type,
  itemUrl,
  albumUrl,
  showAlbum,
  isDropdownItem,
  primaryArtists,
}: Props) => {
  const Wrapper = isDropdownItem ? DropdownMenuItem : React.Fragment;

  return (
    <>
      <Wrapper asChild>
        <Link
          href={getHref(itemUrl, type === "song" ? "song" : "show")}
          className="cursor-pointer"
        >
          <Music className="mr-2 inline-block size-5" />
          {type === "song" ? "Song Details & Lyrics" : "View Episode Details"}
        </Link>
      </Wrapper>

      {showAlbum && albumUrl && (
        <Wrapper asChild>
          <Link href={getHref(albumUrl, "album")} className="cursor-pointer">
            <Disc className="mr-2 inline-block size-5" />
            More from Album
          </Link>
        </Wrapper>
      )}

      {primaryArtists?.map((artist) => (
        <Wrapper key={artist.id} asChild>
          <Link href={getHref(artist.url, "artist")}>
            <Mic2 className="mr-2 inline-block size-5" />
            More From {artist.name}
          </Link>
        </Wrapper>
      ))}
    </>
  );
};
