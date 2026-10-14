import type { ArtistMini } from "@infinitunes/types";
import { DropdownMenuItem } from "@infinitunes/ui/components/dropdown-menu";
import { Disc, Mic2, Music } from "lucide-react";
import Link from "next/link";
import type { ReactElement } from "react";

import { getHref } from "~/lib/utils";

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

  // In the desktop dropdown the item is a flex row, so the label span can
  // truncate; the phone drawer keeps the plain inline text.
  const label = (text: string) =>
    isDropdownItem ? (
      <span className="min-w-0 truncate" title={text}>
        {text}
      </span>
    ) : (
      text
    );

  return (
    <>
      <Wrapper isDropdownItem={isDropdownItem}>
        <Link
          href={getHref(itemUrl, type)}
          className="min-h-(--ctl-lg) shrink-0 cursor-pointer py-3 md:min-h-0 md:py-1"
        >
          <Music className="mr-2 inline-block size-5" />
          {label(
            type === "song" ? "Song Details & Lyrics" : "View Episode Details",
          )}
        </Link>
      </Wrapper>

      {showAlbum && albumUrl && (
        <Wrapper isDropdownItem={isDropdownItem}>
          <Link
            href={getHref(albumUrl, "album")}
            className="min-h-(--ctl-lg) shrink-0 cursor-pointer py-3 md:min-h-0 md:py-1"
          >
            <Disc className="mr-2 inline-block size-5" />
            {label("More from Album")}
          </Link>
        </Wrapper>
      )}

      {primaryArtists?.map(({ id, perma_url, name }) => (
        <Wrapper key={id} isDropdownItem={isDropdownItem}>
          <Link
            href={getHref(perma_url, "artist")}
            className="min-h-(--ctl-lg) shrink-0 cursor-pointer py-3 md:min-h-0 md:py-1"
          >
            <Mic2 className="mr-2 inline-block size-5" />
            {label(`More From ${name}`)}
          </Link>
        </Wrapper>
      ))}
    </>
  );
}

type WrapperProps = {
  isDropdownItem?: boolean;
  children: ReactElement;
};

function Wrapper({ isDropdownItem, children }: WrapperProps) {
  return isDropdownItem ? <DropdownMenuItem render={children} /> : children;
}
