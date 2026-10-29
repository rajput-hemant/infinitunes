import { formatDuration } from "@infinitunes/types";
import type { ReactElement } from "react";

import { playerStore, usePlayer } from "~/playback/player-store";
import { togglePlayback } from "~/playback/transport";
import { useCurrentTrackState } from "~/playback/use-current-track";
import { useFavoriteToggle } from "~/user-data/favorites";

import { DownloadMark } from "./download-ring";
import { LikeButton } from "./like-button";
import { ListRow } from "./list-row";
import { SongContextLink, SongMenuButton, type TrackItem } from "./song-menu";
import { SwipeableRow, type SwipeAction } from "./swipeable-row";
import { Text } from "./ui/text";

type SongRowProps = {
  song: TrackItem;
  /** Starts this row's list from here, e.g. `playTracks(rows, { startIndex })`. */
  onPress: () => void;
  /** The queue sheet's rows: match this exact entry, not every copy of the song. */
  queueItemId?: string;
  /** The list's own destructive menu action (remove from queue or playlist). */
  removal?: { title: string; onRemove: () => void };
  /** A destructive swipe from the right edge (unlike, remove); the menu has it too. */
  trailingSwipe?: SwipeAction;
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
  trailingSwipe,
  leading = "artwork",
  index,
}: SongRowProps) {
  const { isCurrent, isPlaying } = useCurrentTrackState({
    id: song.id,
    queueItemId,
  });
  const hasUpNext = usePlayer(
    (state) => state.queue.length > state.currentIndex + 1,
  );
  const { liked, toggle } = useFavoriteToggle({ type: "song", token: song.id });
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
          <DownloadMark id={song.id} />
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

  const link = (
    <SongContextLink song={song} removal={removal}>
      {row}
    </SongContextLink>
  );
  // Queue rows swipe in the player; every other row has Apple Music's swipes.
  if (queueItemId) return link;
  // Favourite by default; a list's own destructive action replaces it.
  const trailing =
    trailingSwipe ??
    (song.type === "song"
      ? {
          label: liked ? "Unfavourite" : "Favourite",
          icon: liked
            ? { ios: "heart.slash.fill", android: "heart_broken" }
            : { ios: "heart.fill", android: "favorite" },
          tone: "pink",
          onPress: () => void toggle(),
        }
      : undefined);
  return (
    <SwipeableRow
      leading={swipeLeading(song, hasUpNext)}
      trailing={trailing ? [trailing] : undefined}
    >
      {link}
    </SwipeableRow>
  );
}

/**
 * Apple Music's leading pair: Play Next alone, and Add to Queue as a second
 * capsule once something is queued after the current song.
 */
function swipeLeading(song: TrackItem, hasUpNext: boolean): SwipeAction[] {
  const { playNext, addToQueue } = playerStore.getState();
  const next: SwipeAction = {
    label: "Play Next",
    icon: {
      ios: "text.line.first.and.arrowtriangle.forward",
      android: "playlist_play",
    },
    tone: "indigo",
    onPress: () => {
      playNext(song);
    },
  };
  if (!hasUpNext) return [next];
  return [
    next,
    {
      label: "Add to Queue",
      icon: {
        ios: "text.line.last.and.arrowtriangle.forward",
        android: "playlist_add",
      },
      tone: "orange",
      onPress: () => {
        addToQueue(song);
      },
    },
  ];
}
