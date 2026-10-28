"use client";

import type { LyricLine } from "@infinitunes/core/lyrics";
import { createPositionStore } from "@infinitunes/core/react/position-store";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@infinitunes/ui/components/accordion";
import React from "react";

import { SyncedLyrics } from "~/components/player/synced-lyrics";
import { useCurrentSongIndex, useQueue } from "~/hooks/use-store";
import { playerSeek, playhead } from "~/lib/playhead";

export type SongLyricsData = {
  synced: LyricLine[] | null;
  plain: string | null;
  source: "lrclib" | "jiosaavn";
  copyright: string | null;
};

type LyricsProps = { id: string; lyrics: SongLyricsData };

// A playhead that matches no line, for a song that is not the current track.
const idle = createPositionStore(-1);
const SNIPPET_LINES = 4;
const noSeek = () => {};
const seekPlayer = (seconds: number) => playerSeek.current?.(seconds);

export function lyricsSnippet({ synced, plain }: SongLyricsData) {
  const text = plain ?? synced?.map((line) => line.text).join("\n") ?? "";
  return text
    .split("\n")
    .filter((line) => line.trim())
    .slice(0, SNIPPET_LINES)
    .join("\n");
}

export function Lyrics({ id, lyrics }: LyricsProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(true);
  const [queue] = useQueue();
  const [index] = useCurrentSongIndex();
  const isCurrent = queue[index]?.id === id;

  return (
    <Accordion
      onValueChange={(openItems) =>
        setIsCollapsed(!openItems.includes("lyrics"))
      }
    >
      <AccordionItem value="lyrics">
        <AccordionTrigger className="no-underline!">
          <div className="flex flex-col items-start gap-2">
            <h2 className="pl-2 font-heading text-xl text-foreground sm:text-2xl md:text-3xl lg:pl-0">
              Lyrics
            </h2>

            {isCollapsed && (
              <>
                <p className="text-sm whitespace-pre-line text-muted-foreground">
                  {lyricsSnippet(lyrics)}
                </p>

                <p className="text-sm italic">Read More...</p>
              </>
            )}
          </div>
        </AccordionTrigger>

        <AccordionContent>
          {lyrics.synced ? (
            <div className="h-80 sm:h-96">
              <SyncedLyrics
                key={id}
                lines={lyrics.synced}
                position={isCurrent ? playhead : idle}
                onSeek={isCurrent ? seekPlayer : noSeek}
              />
            </div>
          ) : (
            <p className="text-sm whitespace-pre-line text-muted-foreground">
              {lyrics.plain}
            </p>
          )}
          {lyrics.source !== "lrclib" && lyrics.copyright ? (
            <p className="mt-4 text-xs text-muted-foreground">
              {lyrics.copyright}
            </p>
          ) : null}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
