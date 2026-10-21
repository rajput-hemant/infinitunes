import { selectionAsync } from "expo-haptics";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { Artwork } from "~/components/ui/artwork";
import { Icon } from "~/components/ui/icon";
import { selectCurrentTrack, usePlayer } from "~/playback/player-store";
import { art, maxFontScale, radii } from "~/theme/tokens";

import { RadioBadge } from "./radio-badge";
import { NextTrackButton, PlayPauseButton } from "./transport-controls";
import { WashText } from "./wash";

/** The "Not playing" placeholder: the mini artwork's frame. */
const PLACEHOLDER = {
  width: art.mini,
  height: art.mini,
  borderRadius: radii.sm,
};

/**
 * The compact player: the current track, play/pause and next, and a tap
 * target that opens the full player. It draws no background of its own; the
 * host supplies it (the iOS 26 tab bar accessory's glass, or the floating
 * dock, which on Android lays it on the artwork's tonal surface through
 * `OnWash`). The dock and the accessory have a fixed height, so text scales
 * only up to `maxFontScale.chrome`.
 */
export function MiniPlayer() {
  const router = useRouter();
  const track = usePlayer(selectCurrentTrack);

  const openPlayer = () => {
    void selectionAsync();
    router.push("/player");
  };

  return (
    <View className="flex-1 flex-row items-center pl-4 pr-1">
      <Pressable
        onPress={openPlayer}
        accessibilityRole="button"
        accessibilityLabel={
          track ? `Now playing ${track.name}, ${track.subtitle}` : "Not playing"
        }
        accessibilityHint="Opens the player"
        className="flex-1 flex-row items-center gap-3"
      >
        {track ? (
          <Artwork image={track.image} size="mini" />
        ) : (
          <View
            className="items-center justify-center bg-muted"
            style={PLACEHOLDER}
          >
            <Icon
              name={{ ios: "music.note", android: "music_note" }}
              size="sm"
            />
          </View>
        )}
        <View className="flex-1">
          <WashText
            variant="subhead"
            numberOfLines={1}
            maxFontSizeMultiplier={maxFontScale.chrome}
          >
            {track?.name ?? "Not playing"}
          </WashText>
          {track ? (
            <View className="flex-row items-center gap-1">
              <RadioBadge />
              <WashText
                variant="caption"
                tone="muted"
                numberOfLines={1}
                maxFontSizeMultiplier={maxFontScale.chrome}
                className="flex-1"
              >
                {track.subtitle}
              </WashText>
            </View>
          ) : null}
        </View>
      </Pressable>
      {track ? (
        <>
          <PlayPauseButton size="lg" />
          <NextTrackButton size="md" />
        </>
      ) : null}
    </View>
  );
}
