import { useTheme } from "expo-router";
import { Pressable, View } from "react-native";

import { togglePlayback } from "~/playback/transport";
import { useCurrentTrackState } from "~/playback/use-current-track";
import { radii, sizes } from "~/theme/tokens";

import { LikeButton } from "./like-button";
import { MenuTrigger } from "./menu-trigger";
import { SongMenu, type TrackItem } from "./song-menu";
import { Artwork } from "./ui/artwork";
import { Icon } from "./ui/icon";
import { Text } from "./ui/text";

type SongRowProps = {
  song: TrackItem;
  /** Starts this row's list from here, e.g. `playTracks(rows, { startIndex })`. */
  onPress: () => void;
  /** The queue sheet's rows: match this exact entry, not every copy of the song. */
  queueItemId?: string;
  /** The list's own destructive menu action (remove from queue or playlist). */
  removal?: { title: string; onRemove: () => void };
};

/** Credits for the row: the primary artists when the row has them. */
function creditsOf(song: TrackItem): string {
  const names = song.primaryArtists?.map((artist) => artist.name).join(", ");
  return names || song.subtitle;
}

/**
 * One song or episode: artwork, title and credits, its heart and its menu.
 * Pressing the playing row pauses or resumes it instead of restarting.
 */
export function SongRow({ song, onPress, queueItemId, removal }: SongRowProps) {
  const { colors } = useTheme();
  const { isCurrent, isPlaying } = useCurrentTrackState({
    id: song.id,
    queueItemId,
  });

  return (
    <View className="min-h-row flex-row items-center gap-3 py-1 pl-page pr-2">
      <Pressable
        onPress={isCurrent ? togglePlayback : onPress}
        accessibilityRole="button"
        accessibilityLabel={song.name}
        accessibilityHint={isPlaying ? "Pauses playback" : "Plays this song"}
        accessibilityState={{ selected: isCurrent }}
        className="flex-1 flex-row items-center gap-3 active:opacity-70"
      >
        <View>
          <Artwork
            image={song.image}
            quality="medium"
            style={{
              width: sizes.art,
              height: sizes.art,
              borderRadius: radii.sm,
            }}
          />
          {isCurrent ? (
            <View
              testID="now-playing"
              className="absolute inset-0 items-center justify-center rounded-sm bg-scrim"
            >
              <Icon
                name={
                  isPlaying
                    ? { ios: "waveform", android: "graphic_eq" }
                    : { ios: "pause.fill", android: "pause" }
                }
                size={18}
                color="white"
              />
            </View>
          ) : null}
        </View>
        <View className="flex-1">
          <Text
            variant="body"
            numberOfLines={1}
            style={isCurrent ? { color: colors.primary } : undefined}
          >
            {song.name}
          </Text>
          <Text variant="subhead" tone="muted" numberOfLines={1}>
            {creditsOf(song)}
          </Text>
        </View>
      </Pressable>
      {song.type === "song" ? (
        <LikeButton type="song" token={song.id} name={song.name} size={20} />
      ) : null}
      <SongMenu song={song} removal={removal}>
        <MenuTrigger label={`More actions for ${song.name}`} />
      </SongMenu>
    </View>
  );
}
