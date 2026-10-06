import type { ArtistMini } from "@infinitunes/types";
import { decode } from "@infinitunes/types";
import Link from "next/link";

import { cn, getHref } from "~/lib/utils";

/** Credits shown in a row before the rest collapse into "+N more". */
const MAX_CREDITS = 3;

type Credit = Pick<ArtistMini, "id" | "name" | "perma_url">;

type ArtistLinksProps = {
  artists: Credit[];
  className?: string;
  linkClassName?: string;
};

/**
 * One clamped line of artist links. Past three credits the rest collapse into
 * a visible "+N more" suffix kept outside the clamp so long names cannot hide
 * it; the hidden credits stay reachable as links for keyboard and screen readers.
 */
export function ArtistLinks(props: ArtistLinksProps) {
  const { artists, className, linkClassName } = props;
  const shown = artists.slice(0, MAX_CREDITS);
  const rest = artists.slice(MAX_CREDITS);

  const renderLink = (artist: Credit, last: boolean) => (
    <Link
      key={artist.id}
      href={getHref(artist.perma_url, "artist")}
      className={cn("hover:text-foreground", linkClassName)}
    >
      {decode(artist.name)}
      {!last && ", "}
    </Link>
  );

  return (
    <p
      title={
        rest.length > 0
          ? artists.map((a) => decode(a.name)).join(", ")
          : undefined
      }
      className={cn("flex w-full pb-1", className)}
    >
      <span className="line-clamp-1 min-w-0">
        {shown.map((artist, index) =>
          renderLink(artist, index === shown.length - 1),
        )}
      </span>
      {rest.length > 0 && (
        <>
          <span className="shrink-0 whitespace-pre"> +{rest.length} more</span>
          <span className="sr-only">
            {rest.map((artist, index) =>
              renderLink(artist, index === rest.length - 1),
            )}
          </span>
        </>
      )}
    </p>
  );
}
