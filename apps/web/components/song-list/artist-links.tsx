import type { ArtistMini } from "@infinitunes/types";
import Link from "next/link";

import { cn, getHref } from "~/lib/utils";

/** Credits shown in a row before the rest collapse into "+N more". */
const MAX_CREDITS = 3;

type ArtistLinksProps = {
  artists: Pick<ArtistMini, "id" | "name" | "perma_url">[];
  className?: string;
  linkClassName?: string;
};

/**
 * One clamped line of artist links. Past three credits the rest collapse into
 * "+N more"; the full list is on the song's detail page and the hover title.
 */
export function ArtistLinks(props: ArtistLinksProps) {
  const { artists, className, linkClassName } = props;
  const shown = artists.slice(0, MAX_CREDITS);
  const hidden = artists.length - shown.length;

  return (
    <p
      title={hidden > 0 ? artists.map((a) => a.name).join(", ") : undefined}
      className={cn("line-clamp-1 w-full pb-1", className)}
    >
      {shown.map((artist, index) => (
        <Link
          key={artist.id}
          href={getHref(artist.perma_url, "artist")}
          className={cn("hover:text-foreground", linkClassName)}
        >
          {artist.name}
          {index !== shown.length - 1 && ", "}
        </Link>
      ))}
      {hidden > 0 && <span> +{hidden} more</span>}
    </p>
  );
}
