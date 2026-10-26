import { formatDuration } from "@infinitunes/types";
import type { ReactElement } from "react";

import { togglePlayback } from "~/playback/transport";
import { useCurrentTrackState } from "~/playback/use-current-track";

import { LikeButton } from "./like-button";
import { ListRow } from "./list-row";
import { SongContextLink, SongMenuButton, type TrackItem } from "./song-menu";
import { Text } from "./ui/text";

type SongRowProps = {
  song: TrackItem;
  /** Starts this row's list from here, e.g. `playTracks(rows, { startIndex })`. */
  onPress: () => void;
  /** The queue sheet's rows: match this exact entry, not every copy of the song. */
  queueItemId?: string;
  /** The list's own destructive menu action (remove from queue or playlist). */
  removal?: { title: string; onRemove: () => void };
  /** `index` numbers the row (album track lists) instead of repeating the cover. */
  leading?: "artwork" | "index";
  /** The 1-based track number shown with `leading="index"`. */
  index?: number;
};

/** Credits for the row: the primary artists when the row has them. */
function creditsOf(song: TrackItem): string {
  const names = song.primaryArtists?.map((artist) => artist.name).join(", ");
  return names || song.subtitle;
}

/**
 * One song or episode (`ListRow`): artwork or its track number, title and
 * credits, its heart and its menu. Pressing the playing row pauses or resumes
 * it instead of restarting.
 */
export function SongRow({
  song,
  onPress,
  queueItemId,
  removal,
  leading = "artwork",
  index,
}: SongRowProps) {
  const { isCurrent, isPlaying } = useCurrentTrackState({
    id: song.id,
    queueItemId,
  });
  const credits = creditsOf(song);
  const length =
    leading === "index" && song.duration > 0
      ? // "1:45", not the padded "01:45" (`formatDuration` pads for timers).
        formatDuration(song.duration, "mm:ss").replace(/^0/, "")
      : undefined;

  const row = (
    wrap?: (pressable: ReactElement) => ReactElement,
    onLongPress?: () => void,
  ) => (
    <ListRow
      title={song.name}
      subtitle={credits}
      explicit={song.explicit}
      leading={
        leading === "index" && index !== undefined
          ? { index }
          : { artwork: song.image }
      }
      selected={isCurrent}
      paused={isCurrent && !isPlaying}
      onPress={isCurrent ? togglePlayback : onPress}
      onLongPress={onLongPress}
      wrap={wrap}
      accessibilityLabel={song.name}
      accessibilityValue={{
        text: [song.explicit && "Explicit", credits, length]
          .filter(Boolean)
          .join(", "),
      }}
      accessibilityHint={
        isCurrent
          ? isPlaying
            ? "Now playing. Pauses playback"
            : "Paused. Resumes playback"
          : "Plays this song"
      }
      trailing={
        <>
          {/* A numbered list shares one cover, so its rows have room for the length. */}
          {length ? (
            <Text variant="footnote" tone="muted" numeric>
              {length}
            </Text>
          ) : null}
          {song.type === "song" ? (
            <LikeButton
              type="song"
              token={song.id}
              name={song.name}
              size="md"
            />
          ) : null}
          <SongMenuButton song={song} removal={removal} />
        </>
      }
    />
  );

  return (
    <SongContextLink song={song} removal={removal}>
      {row}
    </SongContextLink>
  );
}
