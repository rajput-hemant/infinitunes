import { DropdownMenuItem } from "@infinitunes/ui/components/dropdown-menu";
import { Disc, Mic2, Music } from "lucide-react";
import Link from "next/link";
import React from "react";

import { getHref } from "~/lib/utils";
import type { ArtistMini } from "~/types";

type TileMoreLinksProps = {
  type: "song" | "episode";
  itemUrl: string;
  albumUrl?: string;
  showAlbum: boolean;
  isDropdownItem?: boolean;
  primaryArtists?: ArtistMini[];
};

export function TileMoreLinks(props: TileMoreLinksProps) {
  const { type, itemUrl, albumUrl, showAlbum, isDropdownItem, primaryArtists } =
    props;

  return (
    <>
      <Wrapper isDropdownItem={isDropdownItem}>
        <Link
          href={getHref(itemUrl, type === "song" ? "song" : "show")}
          className="cursor-pointer py-1"
        >
          <Music className="mr-2 inline-block size-5" />
          {type === "song" ? "Song Details & Lyrics" : "View Episode Details"}
        </Link>
      </Wrapper>

      {showAlbum && albumUrl && (
        <Wrapper isDropdownItem={isDropdownItem}>
          <Link
            href={getHref(albumUrl, "album")}
            className="cursor-pointer py-1"
          >
            <Disc className="mr-2 inline-block size-5" />
            More from Album
          </Link>
        </Wrapper>
      )}

      <Wrapper isDropdownItem={isDropdownItem}>
        <Link
          href={getHref(itemUrl, type === "song" ? "song" : "show")}
          className="cursor-pointer py-1"
        >
          <Music className="mr-2 inline-block size-5" />
          {type === "song" ? "Song Details & Lyrics" : "View Episode Details"}
        </Link>
      </Wrapper>

      {primaryArtists?.map(({ id, perma_url, title }) => (
        <Wrapper key={id} isDropdownItem={isDropdownItem}>
          <Link
            key={id}
            href={getHref(perma_url, "artist")}
            className="cursor-pointer py-1"
          >
            <Mic2 className="mr-2 inline-block size-5" />
            More From {title}
          </Link>
        </Wrapper>
      ))}
    </>
  );
}

type WrapperProps = {
  isDropdownItem?: boolean;
  children: React.ReactNode;
};

export function Wrapper({ isDropdownItem, children }: WrapperProps) {
  return isDropdownItem ? (
    <DropdownMenuItem render={children as React.ReactElement} />
  ) : (
    children
  );
}
