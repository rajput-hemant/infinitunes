"use client";

/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- Lyrics scroll regions need keyboard access even without seek buttons. */

import type { PositionStore } from "@infinitunes/core/react/position-store";
import type { Queue } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";

import { QueryScope } from "~/components/query-scope";
import { lyricsQueryOptions } from "~/lib/lyrics-query";

import { LyricsSkeleton } from "./lyrics-skeleton";
import { SyncedLyrics } from "./synced-lyrics";

type Props = {
  track: Queue;
  position: PositionStore;
  onSeek: (seconds: number) => void;
};
const emptyClass = "px-2 text-sm text-muted-foreground";

export function ExpandedLyrics(props: Props) {
  return (
    <QueryScope>
      <Lyrics {...props} />
    </QueryScope>
  );
}

function Lyrics({ track, position, onSeek }: Props) {
  const isSong = track.type === "song";
  const lyrics = useQuery({
    ...lyricsQueryOptions(track.id),
    enabled: isSong,
  });
  const data = lyrics.data;
  if (!isSong || lyrics.isError || (data && !data.synced && !data.plain))
    return (
      <output className={emptyClass}>
        {data?.instrumental
          ? "Instrumental track"
          : "No lyrics available for this track."}
      </output>
    );
  if (!data) return <LyricsSkeleton />;
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 px-2">
      {data.synced ? (
        <SyncedLyrics
          key={track.id}
          lines={data.synced}
          position={position}
          onSeek={onSeek}
          prominent
        />
      ) : (
        <section
          aria-label="Lyrics"
          tabIndex={0}
          className="h-full overflow-y-auto overscroll-contain px-2 py-8 text-xl/9 font-semibold whitespace-pre-line text-foreground [mask-image:linear-gradient(to_bottom,transparent,black_2rem,black_calc(100%-2rem),transparent)] forced-colors:[mask-image:none]"
        >
          {data.plain}
        </section>
      )}
      {data.source !== "lrclib" && data.copyright ? (
        <p className="shrink-0 text-xs text-muted-foreground">
          {data.copyright}
        </p>
      ) : null}
    </div>
  );
}
