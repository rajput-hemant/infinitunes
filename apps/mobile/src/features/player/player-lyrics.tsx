import { plainText } from "@infinitunes/types";
import type { Queue } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { Text } from "~/components/ui/text";
import { trpc } from "~/lib/trpc";

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
  const isSong = track.type === "song";
  const lyrics = useQuery({
    ...trpc.get.lyrics.queryOptions({ id: track.id }),
    enabled: isSong,
    staleTime: Infinity,
  });

  let content;
  if (!isSong || lyrics.isError || lyrics.data === null) {
    content = (
      <Text tone="muted" className="text-center">
        No lyrics available for this track.
      </Text>
    );
  } else if (!lyrics.data) {
    content = <ActivityIndicator accessibilityLabel="Loading lyrics" />;
  } else {
    return (
      <ScrollView
        style={{ width: size, height: size }}
        contentContainerClassName="gap-4 py-2"
        accessibilityLabel="Lyrics"
      >
        <Text variant="headline">{plainText(lyrics.data.lyrics)}</Text>
        <Text variant="caption" tone="muted">
          {plainText(lyrics.data.lyrics_copyright)}
        </Text>
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
