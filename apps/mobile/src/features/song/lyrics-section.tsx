import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { SkeletonBlock, SkeletonPulse } from "~/components/ui/skeleton";
import { Text } from "~/components/ui/text";
import { trpc } from "~/lib/trpc";

import { lyricsText } from "./lyrics-text";
import { SectionHeading } from "./section-heading";

type LyricsSectionProps = {
  /** The song's id; upstream looks lyrics up by it. */
  songId: string;
};

/**
 * Collapsed to the upstream snippet; a tap shows the full text and its
 * copyright. Only songs flagged `has_lyrics` render it, and a lookup that
 * comes back empty or fails leaves the section out.
 */
export function LyricsSection({ songId }: LyricsSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: lyrics, isPending } = useQuery(
    trpc.get.lyrics.queryOptions({ id: songId }),
  );

  if (isPending) {
    return (
      <SkeletonPulse>
        <SkeletonBlock className="mx-page my-3 h-24 rounded-lg" />
      </SkeletonPulse>
    );
  }
  if (!lyrics) return null;

  return (
    <View>
      <SectionHeading>Lyrics</SectionHeading>
      <Pressable
        onPress={() => setExpanded((open) => !open)}
        accessibilityRole="button"
        accessibilityLabel={expanded ? "Collapse lyrics" : "Read full lyrics"}
        className="gap-2 px-page py-2 active:opacity-70"
      >
        {expanded ? (
          <>
            <Text tone="muted">{lyricsText(lyrics.lyrics)}</Text>
            <Text variant="caption" tone="muted">
              {lyricsText(lyrics.lyrics_copyright)}
            </Text>
          </>
        ) : (
          <>
            <Text tone="muted" numberOfLines={3}>
              {lyricsText(lyrics.snippet)}
            </Text>
            <Text variant="subhead">Read More</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
