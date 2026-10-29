import { useTheme } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { AnimationSpec } from "expo-symbols";
import { useEffect, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Icon } from "~/components/ui/icon";
import type { SymbolName } from "~/components/ui/icon";
import { IconButton } from "~/components/ui/icon-button";
import { useWashColors } from "~/components/wash";
import { selection } from "~/lib/haptics";
import { usePressScale } from "~/lib/use-press-scale";
import { usePlaybackStatus } from "~/playback/playback-status";
import { playerStore, usePlayer } from "~/playback/player-store";
import { togglePlayback } from "~/playback/transport";
import { springs } from "~/theme/motion";
import { iconSize, sizes } from "~/theme/tokens";
import type { IconSize } from "~/theme/tokens";
import { usePalette, useTokenColor } from "~/theme/use-palette";

import { playerHaptics } from "./haptics";

/** Now Playing's play/pause shape (spec 2.10): a 72pt circle around a 32pt glyph. */
const PROMINENT_EDGE = 72;
/** The paused shape's corners on Android: Material 3 Expressive's extra-large. */
const PAUSED_RADIUS = 24;

/*
 * No haptic in these: `IconButton` taps on its own. The `Pressable` faces
 * below tap through `tapped`, so one press is one tap either way.
 */
const skipNext = () => playerStore.getState().skipToNext();
const skipPrevious = () => playerStore.getState().skipToPrevious();

/** A `Pressable` face's press: the player's light tap, then `action`. */
function tapped(action: () => void) {
  return () => {
    playerHaptics.press();
    action();
  };
}

const tappedPlayPause = tapped(togglePlayback);

function usePlayPause() {
  const playing = usePlaybackStatus((state) => state.playing);
  return {
    icon: playing
      ? ({ ios: "pause.fill", android: "pause" } as const)
      : ({ ios: "play.fill", android: "play_arrow" } as const),
    label: playing ? "Pause" : "Play",
  };
}

/** iOS's play/pause swap: the new glyph bounces once (SF Symbols' bounce effect). */
const BOUNCE: AnimationSpec = { effect: { type: "bounce", wholeSymbol: true } };
/** How long the bounce runs; the spec is dropped after it. */
const BOUNCE_MS = 600;

/**
 * The bounce spec, set only for a moment after `name` changes, never on mount
 * and never under reduce motion. expo-symbols replays the effect on every
 * prop update while a spec is set (a new wash tint would bounce too), so it
 * is dropped once the bounce has run. expo-symbols has no replace transition.
 */
function useGlyphBounce(name: string) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(name);
  // Counts glyph changes that bounce; `settled` is the last one whose bounce ran.
  const [bounce, setBounce] = useState(0);
  const [settled, setSettled] = useState(0);
  if (shown !== name) {
    setShown(name);
    if (!reduceMotion) setBounce(bounce + 1);
  }
  useEffect(() => {
    if (!bounce) return;
    const timer = setTimeout(() => setSettled(bounce), BOUNCE_MS);
    return () => clearTimeout(timer);
  }, [bounce]);
  return bounce > settled ? BOUNCE : undefined;
}

/**
 * Play or pause: the mini player's. A bare glyph on iOS; on Android Material
 * 3's filled icon button in the wash's control colour.
 */
export function PlayPauseButton() {
  const { icon, label } = usePlayPause();
  const wash = useWashColors();
  const primary = useTokenColor("primary");
  const onPrimary = useTokenColor("primary-foreground");
  const { colors } = useTheme();
  const bounce = useGlyphBounce(icon.ios);
  if (Platform.OS === "android") {
    return (
      <IconButton
        icon={icon}
        label={label}
        variant="filled"
        onPress={togglePlayback}
        size="md"
        fill={wash?.control ?? primary}
        color={wash?.onControl ?? onPrimary}
      />
    );
  }
  return (
    <Pressable
      onPress={tappedPlayPause}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-h-touch min-w-touch items-center justify-center active:opacity-60"
    >
      <SymbolView
        name={icon}
        size={iconSize.lg}
        tintColor={colors.text}
        animationSpec={bounce}
      />
    </Pressable>
  );
}

/**
 * Play or pause as a filled circle, Now Playing's main control: the wash's
 * control colour on a wash (3:1 against it, its glyph 4.5:1), `primary`
 * on the D1 palette.
 */
function ProminentPlayPauseButton() {
  const { icon, label } = usePlayPause();
  const playing = label === "Pause";
  return Platform.OS === "android" ? (
    <AndroidProminentPlayPauseButton
      icon={icon}
      label={label}
      playing={playing}
    />
  ) : (
    <IOSProminentPlayPauseButton
      icon={icon}
      label={label}
      bounceName={icon.ios}
    />
  );
}

function AndroidProminentPlayPauseButton({
  icon,
  label,
  playing,
}: {
  icon: SymbolName;
  label: string;
  playing: boolean;
}) {
  const wash = useWashColors();
  const primary = useTokenColor("primary");
  const onPrimary = useTokenColor("primary-foreground");
  // Android: Material 3 Expressive's shape morph, a rounded square while
  // paused and a circle while playing, on the default spatial spring.
  const radius = useSharedValue(playing ? PROMINENT_EDGE / 2 : PAUSED_RADIUS);
  useEffect(() => {
    radius.set(
      withSpring(
        playing ? PROMINENT_EDGE / 2 : PAUSED_RADIUS,
        springs.spatialDefault,
      ),
    );
  }, [playing, radius]);
  const shape = useAnimatedStyle(() => ({ borderRadius: radius.get() }));
  const ripple = usePalette()["fill-2"];

  return (
    <Animated.View
      style={[
        {
          width: PROMINENT_EDGE,
          height: PROMINENT_EDGE,
          overflow: "hidden",
          backgroundColor: wash?.control ?? primary,
        },
        shape,
      ]}
    >
      <Pressable
        onPress={tappedPlayPause}
        accessibilityRole="button"
        accessibilityLabel={label}
        android_ripple={{ color: ripple }}
        className="flex-1 items-center justify-center"
        testID="play-pause-prominent"
      >
        <Icon name={icon} size="xl" color={wash?.onControl ?? onPrimary} />
      </Pressable>
    </Animated.View>
  );
}

function IOSProminentPlayPauseButton({
  icon,
  label,
  bounceName,
}: {
  icon: SymbolName;
  label: string;
  bounceName: string;
}) {
  const wash = useWashColors();
  const primary = useTokenColor("primary");
  const onPrimary = useTokenColor("primary-foreground");
  const bounce = useGlyphBounce(bounceName);
  const press = usePressScale(0.88);

  return (
    <Animated.View style={press.style}>
      <Pressable
        onPress={tappedPlayPause}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
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
        <SymbolView
          name={icon}
          size={iconSize.xl}
          tintColor={wash?.onControl ?? onPrimary}
          animationSpec={bounce}
        />
      </Pressable>
    </Animated.View>
  );
}

export function NextTrackButton({ size = "xl" }: { size?: IconSize }) {
  return (
    <IconButton
      icon={{ ios: "forward.fill", android: "skip_next" }}
      label="Next track"
      onPress={skipNext}
      size={size}
    />
  );
}

export function shuffleIcon(on: boolean): SymbolName {
  return { ios: "shuffle", android: on ? "shuffle_on" : "shuffle" };
}

export const REPEAT_LABELS = {
  off: "Repeat off",
  playlist: "Repeat all",
  track: "Repeat one",
} as const;

export const REPEAT_ICONS = {
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
 * Shuffle, repeat or lyrics. "On" is a filled circle behind the glyph (Apple Music's
 * cue), not only a colour: iOS draws the same symbol in both states, and on
 * the D1 palette iOS's `primary` is the label colour. The circle takes the
 * play shape's colours, so it is already checked: `control` 3:1 on every
 * wash stop, the glyph in `onControl` 4.5:1 on it; on the D1 palette
 * `primary` and `primary-foreground`. Off, the glyph is the wash's `muted`
 * (the default foreground on the D1 palette).
 */
export function ModeToggle({ icon, label, on, onPress }: ModeToggleProps) {
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
        selection();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      className="min-h-touch min-w-touch items-center justify-center active:opacity-60"
    >
      {/* Never flattened: off, a transparent view with only a radius is no
          native view, and Android's Fabric then creates it on "on" with only
          the changed props, so it drew square (no radius). */}
      <View
        collapsable={false}
        className="items-center justify-center rounded-full"
        style={{
          width: sizes.ctl,
          height: sizes.ctl,
          backgroundColor: on ? fill : "transparent",
        }}
        testID={on ? "mode-toggle-on" : "mode-toggle-off"}
      >
        <Icon name={icon} size="md" color={glyph} />
      </View>
    </Pressable>
  );
}

/** The tonal skip buttons' tint: their text colour at this opacity. */
const TONAL_ALPHA = 0.14;

/**
 * Previous or next on Android's Now Playing: Material 3 Expressive's tonal
 * icon button, a 56dp rounded square tinted from the text colour, so it reads
 * on any wash.
 */
function TonalSkipButton({
  icon,
  label,
  onPress,
}: {
  icon: SymbolName;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const wash = useWashColors();
  const ink = wash?.foreground ?? colors.text;
  const ripple = usePalette()["fill-2"];
  return (
    <Pressable
      onPress={tapped(onPress)}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ color: ripple }}
      className="size-row items-center justify-center overflow-hidden rounded-lg"
    >
      <View
        className="absolute inset-0"
        style={{ backgroundColor: ink, opacity: TONAL_ALPHA }}
      />
      <Icon name={icon} size="xl" color={ink} />
    </Pressable>
  );
}

/** An empty slot as wide as a mode toggle, so the transport keeps its place. */
const MODE_SLOT = { width: sizes.touch, height: sizes.touch };

/**
 * Now Playing's row: shuffle, previous, play/pause, next, repeat. `modes`
 * false leaves shuffle and repeat to the queue's mode pills (empty slots
 * keep the other buttons in place).
 */
export function TransportControls({ modes = true }: { modes?: boolean }) {
  const shuffle = usePlayer((state) => state.shuffle);
  const repeat = usePlayer((state) => state.repeat);
  const { toggleShuffle, cycleRepeat } = playerStore.getState();

  return (
    <View className="flex-row items-center justify-between">
      {modes ? (
        <ModeToggle
          icon={shuffleIcon(shuffle)}
          label="Shuffle"
          on={shuffle}
          onPress={toggleShuffle}
        />
      ) : (
        <View style={MODE_SLOT} />
      )}
      {Platform.OS === "android" ? (
        <TonalSkipButton
          icon={{ ios: "backward.fill", android: "skip_previous" }}
          label="Previous track"
          onPress={skipPrevious}
        />
      ) : (
        <IconButton
          icon={{ ios: "backward.fill", android: "skip_previous" }}
          label="Previous track"
          onPress={skipPrevious}
          size="xl"
        />
      )}
      <ProminentPlayPauseButton />
      {Platform.OS === "android" ? (
        <TonalSkipButton
          icon={{ ios: "forward.fill", android: "skip_next" }}
          label="Next track"
          onPress={skipNext}
        />
      ) : (
        <NextTrackButton size="xl" />
      )}
      {modes ? (
        <ModeToggle
          icon={REPEAT_ICONS[repeat]}
          label={REPEAT_LABELS[repeat]}
          on={repeat !== "off"}
          onPress={() => cycleRepeat()}
        />
      ) : (
        <View style={MODE_SLOT} />
      )}
    </View>
  );
}
