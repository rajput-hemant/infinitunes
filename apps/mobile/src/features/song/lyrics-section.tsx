import { useState } from "react";
import { Platform, Pressable, View } from "react-native";

import { SectionHeader } from "~/components/section-header";
import { LyricsSkeleton } from "~/components/skeletons";
import { SyncedLyrics } from "~/components/synced-lyrics";
import { Text } from "~/components/ui/text";
import { useLyrics } from "~/lib/use-lyrics";
import { art } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";

export function LyricsSection({ songId }: { songId: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: lyrics, isPending } = useLyrics(songId);
  const palette = usePalette();
  // Android: the preview is a filled card (YouTube Music's lyrics card) with
  // a primary text action.
  const android = Platform.OS === "android";
  if (isPending) return <LyricsSkeleton />;
  if (!lyrics?.synced && !lyrics?.plain) return null;
  const preview =
    lyrics.plain ?? lyrics.synced?.map((line) => line.text).join("\n");
  // A label replaces the pressable's content for screen readers, so it leads
  // with the first lyric line the sighted preview shows.
  const firstLine = preview
    ?.split("\n")
    .find((line) => line.trim())
    ?.trim();
  const readLabel = firstLine
    ? `${firstLine}. Read full lyrics`
    : "Read full lyrics";
  return (
    <View>
      <SectionHeader title="Lyrics" />
      <Pressable
        onPress={() => setExpanded((open) => !open)}
        accessibilityRole="button"
        accessibilityLabel={expanded ? "Collapse lyrics" : readLabel}
        accessibilityState={{ expanded }}
        android_ripple={{ color: palette["fill-2"], foreground: true }}
        className={
          android
            ? "mx-page min-h-touch gap-3 overflow-hidden rounded-lg bg-card p-4"
            : "min-h-touch gap-2 px-page py-2 active:opacity-70"
        }
      >
        {!expanded && (
          <Text
            variant={android ? "headline" : "body"}
            emphasized
            tone={android ? "default" : "muted"}
            numberOfLines={android ? 4 : 3}
          >
            {preview}
          </Text>
        )}
        <Text
          variant={android ? "label" : "subhead"}
          tone={android ? "primary" : "default"}
        >
          {expanded ? "Read Less" : "Read More"}
        </Text>
      </Pressable>
      {expanded && (
        <View className={android ? "gap-2 px-page pt-3" : "gap-2 px-page"}>
          {lyrics.synced ? (
            <SyncedLyrics
              key={songId}
              songId={songId}
              lines={lyrics.synced}
              height={art.hero}
            />
          ) : (
            <Text tone="muted">{lyrics.plain}</Text>
          )}
          {lyrics.source !== "lrclib" && lyrics.copyright ? (
            <Text variant="caption" tone="muted">
              {lyrics.copyright}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}
