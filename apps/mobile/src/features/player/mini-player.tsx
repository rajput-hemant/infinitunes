import { selectionAsync } from "expo-haptics";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { Artwork } from "~/components/ui/artwork";
import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { selectCurrentTrack, usePlayer } from "~/playback/player-store";
import { radii } from "~/theme/tokens";

import { RadioBadge } from "./radio-badge";
import { NextTrackButton, PlayPauseButton } from "./transport-controls";

const ARTWORK_SIZE = 36;

/**
 * The dock and the tab bar accessory have a fixed height, so the text may
 * grow only this far; the full player has no such limit.
 */
const MAX_FONT_SCALE = 1.3;

/**
 * The compact player: the current track, play/pause and next, and a tap
 * target that opens the full player. It draws no background of its own; the
 * host (tab bar accessory or floating dock) supplies the platform material.
 */
export function MiniPlayer() {
  const router = useRouter();
  const track = usePlayer(selectCurrentTrack);

  const openPlayer = () => {
    void selectionAsync();
    router.push("/player");
  };

  return (
    <View className="flex-1 flex-row items-center gap-1 pl-4 pr-2">
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
          <Artwork
            image={track.image}
            quality="medium"
            style={{
              width: ARTWORK_SIZE,
              height: ARTWORK_SIZE,
              borderRadius: radii.sm,
            }}
          />
        ) : (
          <View className="size-9 items-center justify-center rounded-sm bg-muted">
            <Icon
              name={{ ios: "music.note", android: "music_note" }}
              size={18}
            />
          </View>
        )}
        <View className="flex-1">
          <Text
            variant="subhead"
            numberOfLines={1}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
          >
            {track?.name ?? "Not playing"}
          </Text>
          {track ? (
            <View className="flex-row items-center gap-1.5">
              <RadioBadge />
              <Text
                variant="caption"
                tone="muted"
                numberOfLines={1}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
                className="flex-1"
              >
                {track.subtitle}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      {track ? (
        <>
          <PlayPauseButton size={24} />
          <NextTrackButton size={22} />
        </>
      ) : null}
    </View>
  );
}
