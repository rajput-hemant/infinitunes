"use client";

import type { Queue } from "@infinitunes/types";

import { sanitizeRichText } from "~/lib/sanitize-rich-text";
import { api } from "~/lib/trpc/client";
import { cn } from "~/lib/utils";

type ExpandedLyricsProps = { track: Queue };

const emptyClass = "px-2 text-sm text-muted-foreground";

/** Lyrics of the playing song, fetched only while the Lyrics tab is open. */
export function ExpandedLyrics({ track }: ExpandedLyricsProps) {
  const isSong = track.type === "song";
  const lyrics = api.get.lyrics.useQuery(
    { id: track.id },
    { enabled: isSong, retry: false, staleTime: Infinity },
  );

  if (!isSong || lyrics.isError) {
    return <p className={emptyClass}>No lyrics available for this track.</p>;
  }
  if (!lyrics.data) {
    return (
      <output className={cn(emptyClass, "block")}>Loading lyrics...</output>
    );
  }
  return (
    <div className="px-2">
      <p
        className="text-base/6 font-semibold tracking-tight text-muted-foreground"
        dangerouslySetInnerHTML={{
          __html: sanitizeRichText(
            `${lyrics.data.lyrics}<br/><br/>${lyrics.data.lyrics_copyright}`,
          ),
        }}
      />
    </div>
  );
}
