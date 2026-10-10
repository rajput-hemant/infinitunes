"use client";

import { toQueue } from "@infinitunes/types";
import type { Lang, Song } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { useSearchParams } from "next/navigation";
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
export function SurpriseMeButton(props: ComponentProps<typeof Button>) {
  const lang = useSearchParams().get("lang") as Lang | null;

  const [, setQueue] = useQueue();
  const [, setCurrentIndex] = useCurrentSongIndex();
  const [, setIsPlayerInit] = useIsPlayerInit();
  const [, setActiveRadio] = useActiveRadioSession();

  const utils = api.useUtils();

  async function surprise() {
    try {
      const trending = await utils.get.trending.fetch({
        type: "song",
        lang: lang ?? undefined,
      });
      const songs = trending.filter(
        (item): item is Song => item.type === "song",
      );
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
    } catch {
      toast.error("Failed to load songs");
    }
  }

  return (
    <Button
      aria-label="Surprise Me - Add songs to queue and play"
      onClick={surprise}
      {...props}
    >
      Surprise Me
    </Button>
  );
}
