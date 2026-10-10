"use client";

import { toQueue } from "@infinitunes/types";
import type { Lang, Song } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import type { ComponentProps } from "react";
import { toast } from "sonner";

import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "~/hooks/use-store";
import { api } from "~/lib/trpc/client";

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Like jiosaavn.com: replaces the queue with a shuffled batch of trending songs and plays it. */
export function SurpriseMeButton({
  onQueued,
  ...props
}: ComponentProps<typeof Button> & { onQueued?: () => void }) {
  const lang = useSearchParams().get("lang") as Lang | null;

  const [queue, setQueue] = useQueue();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();
  const [, setIsPlayerInit] = useIsPlayerInit();
  const [activeRadio, setActiveRadio] = useActiveRadioSession();
  const [pending, setPending] = useState(false);

  // Latest playback state, read after the await to detect a newer choice.
  const playback = { queue, currentIndex, activeRadio };
  const latest = useRef(playback);
  latest.current = playback;
  const inFlight = useRef(false);

  const utils = api.useUtils();

  async function surprise() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    const start = latest.current;
    try {
      const trending = await utils.get.trending.fetch({
        type: "song",
        lang: lang ?? undefined,
      });
      const songs = trending.filter(
        (item): item is Song => item.type === "song",
      );
      const now = latest.current;
      if (
        now.queue !== start.queue ||
        now.currentIndex !== start.currentIndex ||
        now.activeRadio !== start.activeRadio
      ) {
        return;
      }
      if (!songs.length) {
        toast.error("No songs found right now");
        return;
      }

      const queue = shuffle(songs).map(toQueue);
      setActiveRadio(null);
      setQueue(queue);
      setCurrentIndex(0);
      setIsPlayerInit(true);
      toast.success(`${queue.length} songs added to the queue`, {
        description: `Playing “${queue[0]?.name}”`,
        position: "bottom-center",
      });
      onQueued?.();
    } catch {
      toast.error("Failed to load songs");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <Button
      aria-label="Surprise Me - Add songs to queue and play"
      onClick={surprise}
      disabled={pending}
      {...props}
    >
      Surprise Me
    </Button>
  );
}
