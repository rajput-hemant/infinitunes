import type { Queue } from "@infinitunes/types";
import { ScrollView, View } from "react-native";

import { SyncedLyrics } from "~/components/synced-lyrics";
import { Spinner } from "~/components/ui/spinner";
import { useLyrics } from "~/lib/use-lyrics";

import { useWashColors, WashText } from "./wash";

type PlayerLyricsProps = { track: Queue; size: number };

export function PlayerLyrics({ track, size }: PlayerLyricsProps) {
  const wash = useWashColors();
  const isSong = track.type === "song";
  const lyrics = useLyrics(track.id, isSong);
  const data = lyrics.data;
  if (data?.synced && isSong)
    return (
      <View style={{ width: size }}>
        <SyncedLyrics
          key={track.id}
          lines={data.synced}
          songId={track.id}
          height={size}
          foreground={wash?.foreground}
          muted={wash?.muted}
        />
      </View>
    );
  if (data?.plain && isSong)
    return (
      <ScrollView
        style={{ width: size, height: size }}
        contentContainerClassName="gap-4 py-2"
        accessibilityLabel="Lyrics"
      >
        <WashText variant="headline">{data.plain}</WashText>
        {data.source !== "lrclib" && data.copyright ? (
          <WashText variant="caption" tone="muted">
            {data.copyright}
          </WashText>
        ) : null}
      </ScrollView>
    );
  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
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
