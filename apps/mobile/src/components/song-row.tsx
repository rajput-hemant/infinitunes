import { togglePlayback } from "~/playback/transport";
import { useCurrentTrackState } from "~/playback/use-current-track";

import { LikeButton } from "./like-button";
import { ListRow } from "./list-row";
import { MenuTrigger } from "./menu-trigger";
import { SongMenu, type TrackItem } from "./song-menu";

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

  return (
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
      onPress={isCurrent ? togglePlayback : onPress}
      accessibilityLabel={song.name}
      accessibilityValue={{
        text: song.explicit ? `Explicit, ${credits}` : credits,
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
          {song.type === "song" ? (
            <LikeButton
              type="song"
              token={song.id}
              name={song.name}
              size="md"
            />
          ) : null}
          <SongMenu song={song} removal={removal}>
            <MenuTrigger label={`More actions for ${song.name}`} />
          </SongMenu>
        </>
      }
    />
  );
}
