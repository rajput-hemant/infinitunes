"use client";

import { toQueue } from "@infinitunes/types";
import type { Song } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";
import { toast } from "sonner";

import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "~/hooks/use-store";
import { trpc } from "~/lib/trpc/vanilla";

import { isLang } from "./lang-guard";

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type PlaybackSnapshot = {
  queue: ReturnType<typeof useQueue>[0];
  currentIndex: ReturnType<typeof useCurrentSongIndex>[0];
  activeRadio: ReturnType<typeof useActiveRadioSession>[0];
};

type SurpriseState = {
  latest: React.RefObject<PlaybackSnapshot>;
  inFlight: React.RefObject<boolean>;
  setPending: (pending: boolean) => void;
  setQueue: ReturnType<typeof useQueue>[1];
  setCurrentIndex: ReturnType<typeof useCurrentSongIndex>[1];
  setIsPlayerInit: ReturnType<typeof useIsPlayerInit>[1];
  setActiveRadio: ReturnType<typeof useActiveRadioSession>[1];
  onQueued?: () => void;
};

/**
 * Queues a shuffled batch from `loadSongs` and plays it, unless playback changed
 * while loading. Kept outside the component: the React Compiler bails out on
 * try/finally.
 */
async function queueSurprise(
  loadSongs: () => Promise<Song[]>,
  state: SurpriseState,
) {
  const {
    latest,
    inFlight,
    setPending,
    setQueue,
    setCurrentIndex,
    setIsPlayerInit,
    setActiveRadio,
    onQueued,
  } = state;

  if (inFlight.current) return;
  inFlight.current = true;
  setPending(true);
  const start = latest.current;
  try {
    const songs = await loadSongs();
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

    const nextQueue = shuffle(songs).map(toQueue);
    setActiveRadio(null);
    setQueue(nextQueue);
    setCurrentIndex(0);
    setIsPlayerInit(true);
    toast.success(`${nextQueue.length} songs added to the queue`, {
      description: `Playing “${nextQueue[0]?.name}”`,
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

/** Like jiosaavn.com: replaces the queue with a shuffled batch of trending songs and plays it. */
export function SurpriseMeButton({
  onQueued,
  ...props
}: ComponentProps<typeof Button> & { onQueued?: () => void }) {
  const rawLang = useSearchParams().get("lang");
  const lang = rawLang && isLang(rawLang) ? rawLang : null;

  const [queue, setQueue] = useQueue();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();
  const [, setIsPlayerInit] = useIsPlayerInit();
  const [activeRadio, setActiveRadio] = useActiveRadioSession();
  const [pending, setPending] = useState(false);

  // Latest playback state, read after the await to detect a newer choice.
  const latest = useRef<PlaybackSnapshot>({ queue, currentIndex, activeRadio });
  useEffect(() => {
    latest.current = { queue, currentIndex, activeRadio };
  }, [queue, currentIndex, activeRadio]);
  const inFlight = useRef(false);

  async function surprise() {
    await queueSurprise(
      async () => {
        const trending = await trpc.get.trending.query({
          type: "song",
          lang: lang ?? undefined,
        });
        return trending.filter((item): item is Song => item.type === "song");
      },
      {
        latest,
        inFlight,
        setPending,
        setQueue,
        setCurrentIndex,
        setIsPlayerInit,
        setActiveRadio,
        onQueued,
      },
    );
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
