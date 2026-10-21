import { plainText } from "@infinitunes/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { SectionHeader } from "~/components/section-header";
import { TextBlockSkeleton } from "~/components/skeletons";
import { Text } from "~/components/ui/text";
import { trpc } from "~/lib/trpc";

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

  if (isPending) return <TextBlockSkeleton />;
  if (!lyrics) return null;

  return (
    <View>
      <SectionHeader title="Lyrics" />
      <Pressable
        onPress={() => setExpanded((open) => !open)}
        accessibilityRole="button"
        accessibilityLabel={expanded ? "Collapse lyrics" : "Read full lyrics"}
        accessibilityState={{ expanded }}
        className="gap-2 px-page py-2 active:opacity-70"
      >
        {expanded ? (
          <>
            <Text tone="muted">{plainText(lyrics.lyrics)}</Text>
            <Text variant="caption" tone="muted">
              {plainText(lyrics.lyrics_copyright)}
            </Text>
          </>
        ) : (
          <>
            <Text tone="muted" numberOfLines={3}>
              {plainText(lyrics.snippet)}
            </Text>
            <Text variant="subhead">Read More</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
