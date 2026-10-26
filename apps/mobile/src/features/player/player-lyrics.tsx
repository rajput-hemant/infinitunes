import type { Queue } from "@infinitunes/types";
import { ScrollView, StyleSheet, View } from "react-native";

import { SyncedLyrics } from "~/components/synced-lyrics";
import { Spinner } from "~/components/ui/spinner";
import { useLyrics } from "~/lib/use-lyrics";
import { space } from "~/theme/tokens";

import { useWashColors, WashText } from "./wash";

type PlayerLyricsProps = {
  track: Queue;
  width: number;
  height: number;
  /**
   * The fill behind the lyrics at their top and bottom edge (the wash's
   * gradient stops, or the D1 background twice); the lines fade into it.
   */
  edges?: readonly [string, string] | null;
};

/** How far the lines fade out at the top and bottom edge. */
const FADE = space.xxl;

/** `#rrggbb` at alpha 0; `null` for any other colour, which then gets no fade. */
function clearOf(color: string) {
  return /^#[\da-f]{6}$/i.test(color) ? `${color}00` : null;
}

/**
 * Soft top and bottom edges: a gradient from the fill to the same colour at
 * alpha 0 (never `transparent`, which would pass through grey).
 */
function EdgeFades({ edges }: { edges: readonly [string, string] }) {
  const [top, bottom] = edges;
  const clearTop = clearOf(top);
  const clearBottom = clearOf(bottom);
  return (
    <>
      {clearTop ? (
        <View
          pointerEvents="none"
          style={[
            styles.fade,
            {
              top: 0,
              backgroundImage: `linear-gradient(180deg, ${top}, ${clearTop})`,
            },
          ]}
        />
      ) : null}
      {clearBottom ? (
        <View
          pointerEvents="none"
          style={[
            styles.fade,
            {
              bottom: 0,
              backgroundImage: `linear-gradient(180deg, ${clearBottom}, ${bottom})`,
            },
          ]}
        />
      ) : null}
    </>
  );
}

export function PlayerLyrics({
  track,
  width,
  height,
  edges,
}: PlayerLyricsProps) {
  const wash = useWashColors();
  const isSong = track.type === "song";
  const lyrics = useLyrics(track.id, isSong);
  const data = lyrics.data;
  if (data?.synced && isSong)
    return (
      <View style={{ width }}>
        <SyncedLyrics
          key={track.id}
          lines={data.synced}
          songId={track.id}
          height={height}
          foreground={wash?.foreground}
          muted={wash?.muted}
          prominent
        />
        {edges ? <EdgeFades edges={edges} /> : null}
      </View>
    );
  if (data?.plain && isSong)
    return (
      <View style={{ width, height }}>
        <ScrollView
          contentContainerClassName="gap-4 py-8"
          accessibilityLabel="Lyrics"
          nestedScrollEnabled
        >
          <WashText variant="headline">{data.plain}</WashText>
          {data.source !== "lrclib" && data.copyright ? (
            <WashText variant="caption" tone="muted">
              {data.copyright}
            </WashText>
          ) : null}
        </ScrollView>
        {edges ? <EdgeFades edges={edges} /> : null}
      </View>
    );
  return (
    <View className="items-center justify-center" style={{ width, height }}>
      {isSong && lyrics.isPending ? (
        <Spinner accessibilityLabel="Loading lyrics" color={wash?.foreground} />
      ) : (
        <WashText tone="muted" className="text-center">
          {data?.instrumental
            ? "Instrumental track"
            : "No lyrics available for this track."}
        </WashText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fade: { position: "absolute", left: 0, right: 0, height: FADE },
});
