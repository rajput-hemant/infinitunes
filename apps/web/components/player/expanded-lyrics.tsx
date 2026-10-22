"use client";

import type { PositionStore } from "@infinitunes/core/react/position-store";
import type { Queue } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";

import { QueryScope } from "~/components/query-scope";
import { trpc } from "~/lib/trpc/vanilla";

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
    queryKey: ["syncedLyrics", track.id],
    queryFn: () => trpc.song.syncedLyrics.query({ id: track.id }),
    enabled: isSong,
    retry: false,
    staleTime: Infinity,
  });
  const data = lyrics.data;
  if (!isSong || lyrics.isError || (data && !data.synced && !data.plain))
    return (
      <p className={emptyClass}>
        {data?.instrumental
          ? "Instrumental track"
          : "No lyrics available for this track."}
      </p>
    );
  if (!data) return <output className={emptyClass}>Loading lyrics...</output>;
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 px-2">
      {data.synced ? (
        <SyncedLyrics
          key={track.id}
          lines={data.synced}
          position={position}
          onSeek={onSeek}
        />
      ) : (
        <p className="overflow-y-auto text-base/6 font-semibold whitespace-pre-line text-muted-foreground">
          {data.plain}
        </p>
      )}
      {data.source !== "lrclib" && data.copyright ? (
        <p className="shrink-0 text-xs text-muted-foreground">
          {data.copyright}
        </p>
      ) : null}
    </div>
  );
}
