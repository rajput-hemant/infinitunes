import { LOOP_MODE_MESSAGES } from "@infinitunes/core/playback-order";
import { selectionAsync } from "expo-haptics";
import { useTheme } from "expo-router";
import { Pressable, View } from "react-native";
import { toast } from "sonner-native";

import { Icon } from "~/components/ui/icon";
import type { SymbolName } from "~/components/ui/icon";
import { IconButton } from "~/components/ui/icon-button";
import { usePlaybackStatus } from "~/playback/playback-status";
import { playerStore, usePlayer } from "~/playback/player-store";
import { togglePlayback } from "~/playback/transport";
import { sizes } from "~/theme/tokens";
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

type ModeToggleProps = {
  icon: SymbolName;
  label: string;
  on: boolean;
  onPress: () => void;
};

/**
 * Shuffle or repeat. "On" is a filled circle behind the glyph (Apple Music's
 * cue), not only a colour: iOS draws the same symbol in both states, and on
 * the D1 palette iOS's `primary` is the label colour. The circle takes the
 * play shape's colours, so it is already checked: `control` 3:1 on every
 * wash stop, the glyph in `onControl` 4.5:1 on it; on the D1 palette
 * `primary` and `primary-foreground`. Off, the glyph is the wash's `muted`
 * (the default foreground on the D1 palette).
 */
function ModeToggle({ icon, label, on, onPress }: ModeToggleProps) {
  const { colors } = useTheme();
  const wash = useWashColors();
  const primary = useTokenColor("primary");
  const onPrimary = useTokenColor("primary-foreground");
  const fill = wash?.control ?? primary;
  const glyph = on
    ? (wash?.onControl ?? onPrimary)
    : (wash?.muted ?? colors.text);

  return (
    <Pressable
      onPress={() => {
        void selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      className="min-h-touch min-w-touch items-center justify-center active:opacity-60"
    >
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: sizes.ctl,
          height: sizes.ctl,
          backgroundColor: on ? fill : "transparent",
        }}
        testID={on ? "mode-toggle-on" : undefined}
      >
        <Icon name={icon} size="md" color={glyph} />
      </View>
    </Pressable>
  );
}

/** Now Playing's row: shuffle, previous, play/pause, next, repeat. */
export function TransportControls() {
  const shuffle = usePlayer((state) => state.shuffle);
  const repeat = usePlayer((state) => state.repeat);
  const { toggleShuffle, skipToPrevious, cycleRepeat } = playerStore.getState();

  return (
    <View className="flex-row items-center justify-between">
      <ModeToggle
        icon={{ ios: "shuffle", android: shuffle ? "shuffle_on" : "shuffle" }}
        label="Shuffle"
        on={shuffle}
        onPress={toggleShuffle}
      />
      <IconButton
        icon={{ ios: "backward.fill", android: "skip_previous" }}
        label="Previous track"
        onPress={skipToPrevious}
        size="xl"
      />
      <ProminentPlayPauseButton />
      <NextTrackButton size="xl" />
      <ModeToggle
        icon={REPEAT_ICONS[repeat]}
        label={REPEAT_LABELS[repeat]}
        on={repeat !== "off"}
        onPress={() => toast(LOOP_MODE_MESSAGES[cycleRepeat()])}
      />
    </View>
  );
}
