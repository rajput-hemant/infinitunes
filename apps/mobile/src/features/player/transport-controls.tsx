import { LOOP_MODE_MESSAGES } from "@infinitunes/core/playback-order";
import { selectionAsync } from "expo-haptics";
import { useTheme } from "expo-router";
import { Pressable, View } from "react-native";
import { toast } from "sonner-native";

import { Icon } from "~/components/ui/icon";
import { IconButton } from "~/components/ui/icon-button";
import { usePlaybackStatus } from "~/playback/playback-status";
import { playerStore, usePlayer } from "~/playback/player-store";
import { togglePlayback } from "~/playback/transport";
import type { IconSize } from "~/theme/tokens";
import { useTokenColor } from "~/theme/use-palette";

import { useWashColors } from "./wash";

/** Now Playing's play/pause shape (spec 2.10): a 72pt circle around a 32pt glyph. */
const PROMINENT_EDGE = 72;

function usePlayPause() {
  const playing = usePlaybackStatus((state) => state.playing);
  return {
    icon: playing
      ? ({ ios: "pause.fill", android: "pause" } as const)
      : ({ ios: "play.fill", android: "play_arrow" } as const),
    label: playing ? "Pause" : "Play",
  };
}

/** Play or pause as a bare glyph: the mini player's. */
export function PlayPauseButton({ size = "lg" }: { size?: IconSize }) {
  const { icon, label } = usePlayPause();
  return (
    <IconButton
      icon={icon}
      label={label}
      onPress={togglePlayback}
      size={size}
    />
  );
}

/**
 * Play or pause as a filled circle, Now Playing's main control: the wash's
 * control colour on a wash (3:1 against it, its glyph 4.5:1), `primary`
 * on the D1 palette.
 */
export function ProminentPlayPauseButton() {
  const { icon, label } = usePlayPause();
  const wash = useWashColors();
  const primary = useTokenColor("primary");
  const onPrimary = useTokenColor("primary-foreground");

  return (
    <Pressable
      onPress={togglePlayback}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="items-center justify-center rounded-full active:opacity-80"
      style={{
        width: PROMINENT_EDGE,
        height: PROMINENT_EDGE,
        backgroundColor: wash?.control ?? primary,
      }}
      testID="play-pause-prominent"
    >
      <Icon name={icon} size="xl" color={wash?.onControl ?? onPrimary} />
    </Pressable>
  );
}

export function NextTrackButton({ size = "xl" }: { size?: IconSize }) {
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

/**
 * A toggle's tint: on a wash, `accent` when on and `muted` when off; on the
 * D1 palette `primary` when on and the default foreground when off.
 */
function useToggleColor() {
  const { colors } = useTheme();
  const wash = useWashColors();
  return (on: boolean) => (on ? (wash?.accent ?? colors.primary) : wash?.muted);
}

/** Now Playing's row: shuffle, previous, play/pause, next, repeat. */
export function TransportControls() {
  const toggleColor = useToggleColor();
  const shuffle = usePlayer((state) => state.shuffle);
  const repeat = usePlayer((state) => state.repeat);
  const { toggleShuffle, skipToPrevious, cycleRepeat } = playerStore.getState();

  return (
    <View className="flex-row items-center justify-between">
      <IconButton
        icon={{ ios: "shuffle", android: shuffle ? "shuffle_on" : "shuffle" }}
        label="Shuffle"
        size="md"
        selected={shuffle}
        color={toggleColor(shuffle)}
        onPress={() => {
          void selectionAsync();
          toggleShuffle();
        }}
      />
      <IconButton
        icon={{ ios: "backward.fill", android: "skip_previous" }}
        label="Previous track"
        onPress={skipToPrevious}
        size="xl"
      />
      <ProminentPlayPauseButton />
      <NextTrackButton size="xl" />
      <IconButton
        icon={REPEAT_ICONS[repeat]}
        label={REPEAT_LABELS[repeat]}
        size="md"
        selected={repeat !== "off"}
        color={toggleColor(repeat !== "off")}
        onPress={() => {
          void selectionAsync();
          toast(LOOP_MODE_MESSAGES[cycleRepeat()]);
        }}
      />
    </View>
  );
}
