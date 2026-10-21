import { LOOP_MODE_MESSAGES } from "@infinitunes/core/playback-order";
import { selectionAsync } from "expo-haptics";
import { useTheme } from "expo-router";
import { View } from "react-native";
import { toast } from "sonner-native";

import { IconButton } from "~/components/ui/icon-button";
import { usePlaybackStatus } from "~/playback/playback-status";
import { playerStore, usePlayer } from "~/playback/player-store";
import { togglePlayback } from "~/playback/transport";

/** Play or pause; the mini player and the full player share it. */
export function PlayPauseButton({ size = 28 }: { size?: number }) {
  const playing = usePlaybackStatus((state) => state.playing);
  return (
    <IconButton
      icon={
        playing
          ? { ios: "pause.fill", android: "pause" }
          : { ios: "play.fill", android: "play_arrow" }
      }
      label={playing ? "Pause" : "Play"}
      onPress={togglePlayback}
      size={size}
    />
  );
}

export function NextTrackButton({ size = 24 }: { size?: number }) {
  return (
    <IconButton
      icon={{ ios: "forward.fill", android: "skip_next" }}
      label="Next track"
      onPress={playerStore.getState().skipToNext}
      size={size}
    />
  );
}

const REPEAT_LABELS = {
  off: "Repeat off",
  playlist: "Repeat all",
  track: "Repeat one",
} as const;

const REPEAT_ICONS = {
  off: { ios: "repeat", android: "repeat" },
  playlist: { ios: "repeat", android: "repeat_on" },
  track: { ios: "repeat.1", android: "repeat_one_on" },
} as const;

/** The full player's row: shuffle, previous, play/pause, next, repeat. */
export function TransportControls() {
  const { colors } = useTheme();
  const shuffle = usePlayer((state) => state.shuffle);
  const repeat = usePlayer((state) => state.repeat);
  const { toggleShuffle, skipToPrevious, cycleRepeat } = playerStore.getState();

  return (
    <View className="flex-row items-center justify-between">
      <IconButton
        icon={{ ios: "shuffle", android: "shuffle" }}
        label="Shuffle"
        selected={shuffle}
        color={shuffle ? colors.primary : undefined}
        onPress={() => {
          void selectionAsync();
          toggleShuffle();
        }}
      />
      <IconButton
        icon={{ ios: "backward.fill", android: "skip_previous" }}
        label="Previous track"
        onPress={skipToPrevious}
        size={30}
      />
      <PlayPauseButton size={44} />
      <NextTrackButton size={30} />
      <IconButton
        icon={REPEAT_ICONS[repeat]}
        label={REPEAT_LABELS[repeat]}
        selected={repeat !== "off"}
        color={repeat === "off" ? undefined : colors.primary}
        onPress={() => {
          void selectionAsync();
          toast(LOOP_MODE_MESSAGES[cycleRepeat()]);
        }}
      />
    </View>
  );
}
