import { plainText } from "@infinitunes/types";
import type { Queue } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { trpc } from "~/lib/trpc";

import { useWashColors, WashText } from "./wash";

type PlayerLyricsProps = {
  track: Queue;
  /** The square the artwork leaves; lyrics scroll inside it. */
  size: number;
};

/**
 * The playing song's lyrics in place of its artwork (the expanded web
 * player's Lyrics tab), fetched only while shown. Episodes and songs
 * upstream has none for say so instead.
 */
export function PlayerLyrics({ track, size }: PlayerLyricsProps) {
  const wash = useWashColors();
  const isSong = track.type === "song";
  const lyrics = useQuery({
    ...trpc.get.lyrics.queryOptions({ id: track.id }),
    enabled: isSong,
    staleTime: Infinity,
  });

  let content;
  if (!isSong || lyrics.isError || lyrics.data === null) {
    content = (
      <WashText tone="muted" className="text-center">
        No lyrics available for this track.
      </WashText>
    );
  } else if (!lyrics.data) {
    content = (
      <ActivityIndicator
        accessibilityLabel="Loading lyrics"
        color={wash?.foreground}
      />
    );
  } else {
    return (
      <ScrollView
        style={{ width: size, height: size }}
        contentContainerClassName="gap-4 py-2"
        accessibilityLabel="Lyrics"
      >
        <WashText variant="headline">{plainText(lyrics.data.lyrics)}</WashText>
        <WashText variant="caption" tone="muted">
          {plainText(lyrics.data.lyrics_copyright)}
        </WashText>
      </ScrollView>
    );
  }

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      {content}
    </View>
  );
}
