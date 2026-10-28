import { formatDuration } from "@infinitunes/types";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Platform, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { useWashColors, WashText } from "~/components/wash";
import {
  playbackPosition,
  usePlaybackPosition,
  usePlaybackStatus,
} from "~/playback/playback-status";
import { seekTo } from "~/playback/transport";
import { useTokenColor } from "~/theme/use-palette";

import { playerHaptics, scrubStep } from "./haptics";
import { useProgressValues } from "./progress-values";
import { SeekSlider } from "./seek-slider";
import { SLIDER_HOST } from "./seek-slider-props";

/** A player clock without the leading zero ("3:07", "0:00"), as system players show it. */
function clock(seconds: number) {
  return formatDuration(seconds, "mm:ss").replace(/^0(?=\d:)/, "");
}

/**
 * The system slider's track inside its host, measured on device: Material 3's
 * 16dp track starting 6dp past a 4dp thumb, iOS 26's 6pt track under a 36pt
 * capsule thumb.
 */
const TRACK = Platform.select({
  ios: { inset: 0, height: 6, thumb: 36, gap: 0, radius: 3 },
  default: { inset: 2, height: 16, thumb: 4, gap: 4, radius: 2 },
});

/** What a screen reader's swipe up or down seeks by, in seconds. */
export const SEEK_STEP_SECONDS = 10;

/** A drag with no slider event for this long counts as released. */
export const SCRUB_STALE_MS = 3000;

/** The playhead in whole seconds: what the clocks show, so they render at 1Hz. */
function useWholeSecond() {
  return useSyncExternalStore(playbackPosition.subscribe, () =>
    Math.floor(playbackPosition.get()),
  );
}

/** The native slider: the one part that follows every playhead tick. */
function PositionSlider({
  scrubbed,
  duration,
  onScrub,
  onScrubEnd,
}: {
  scrubbed: number | null;
  duration: number;
  onScrub: (value: number) => void;
  onScrubEnd: () => void;
}) {
  const position = usePlaybackPosition();
  const wash = useWashColors();
  return (
    <SeekSlider
      value={Math.min(scrubbed ?? position, duration)}
      max={Math.max(duration, 1)}
      onScrub={onScrub}
      onScrubEnd={onScrubEnd}
      colors={wash ? { active: wash.accent, inactive: wash.track } : undefined}
    />
  );
}

/**
 * The loaded range as a lighter part of the native track, from the thumb's far
 * edge on. Placed on the UI thread from shared values, so neither a tick nor
 * a buffer update re-renders React.
 */
function BufferedRange({ scrubbed }: { scrubbed: number | null }) {
  const muted = useTokenColor("muted-foreground");
  const wash = useWashColors();
  const { played, buffered } = useProgressValues(scrubbed);
  const place = useAnimatedStyle(() => ({
    left: `${played.get() * 100}%`,
    width: `${Math.max(buffered.get() - played.get(), 0) * 100}%`,
  }));
  const shape = useAnimatedStyle(() => {
    const full = buffered.get() >= 1;
    return {
      // Fully loaded reaches the track's own end, past the thumb's travel.
      marginRight: full ? -TRACK.thumb / 2 : 0,
      borderTopRightRadius: full ? TRACK.height / 2 : TRACK.radius,
      borderBottomRightRadius: full ? TRACK.height / 2 : TRACK.radius,
    };
  });

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: "absolute",
        // Span the thumb centre's travel, so percentages land where the thumb does.
        left: TRACK.inset + TRACK.thumb / 2,
        right: TRACK.inset + TRACK.thumb / 2,
        top: (SLIDER_HOST.height - TRACK.height) / 2,
      }}
    >
      <Animated.View testID="scrubber-buffered" style={place}>
        <Animated.View
          style={[
            {
              marginLeft: TRACK.thumb / 2 + TRACK.gap,
              height: TRACK.height,
              borderRadius: TRACK.radius,
              backgroundColor: wash?.muted ?? muted,
              opacity: 0.45,
            },
            shape,
          ]}
        />
      </Animated.View>
    </View>
  );
}

/**
 * The full player's seek bar with elapsed and remaining time. While the
 * listener drags it shows the dragged position, and seeks once on release.
 * Only the slider follows every tick (the buffered range is placed on the UI
 * thread); the clocks and the spoken value change once a second.
 */
export function Scrubber() {
  const second = useWholeSecond();
  const duration = usePlaybackStatus((state) => state.duration);
  const [scrubbed, setScrubbed] = useState<number | null>(null);
  const scrubbedRef = useRef<number | null>(null);
  const shown = Math.floor(scrubbed ?? second);
  const stale = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => clearTimeout(stale.current ?? undefined), []);

  function scrub(value: number) {
    // A light tick on each step of the track the drag crosses.
    const from = scrubbedRef.current ?? playbackPosition.get();
    if (scrubStep(value, duration) !== scrubStep(from, duration))
      playerHaptics.tick();
    scrubbedRef.current = value;
    setScrubbed(value);
    // Neither native slider reports a cancelled touch (Compose's or SwiftUI's
    // end callback is all there is): a drag that goes quiet this long is
    // taken as let go, so the shown position never sticks. A finger still
    // resting on the thumb loses nothing: its next move scrubs again.
    clearTimeout(stale.current ?? undefined);
    stale.current = setTimeout(release, SCRUB_STALE_MS);
  }

  function release() {
    clearTimeout(stale.current ?? undefined);
    stale.current = null;
    if (scrubbedRef.current !== null) {
      playerHaptics.release();
      seekTo(scrubbedRef.current);
    }
    scrubbedRef.current = null;
    setScrubbed(null);
  }

  /** Screen readers cannot drag the native slider: they step the position instead. */
  function step(direction: 1 | -1) {
    const next = playbackPosition.get() + direction * SEEK_STEP_SECONDS;
    seekTo(Math.min(Math.max(next, 0), Math.max(duration, 0)));
  }

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Playback position"
      accessibilityHint={`Swipe up or down to seek ${SEEK_STEP_SECONDS} seconds`}
      accessibilityValue={{
        text: `${formatDuration(shown, "mm:ss")} of ${formatDuration(duration, "mm:ss")}`,
      }}
      accessibilityActions={[
        { name: "increment", label: "Forward" },
        { name: "decrement", label: "Back" },
      ]}
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === "increment") step(1);
        if (nativeEvent.actionName === "decrement") step(-1);
      }}
    >
      <View>
        <PositionSlider
          scrubbed={scrubbed}
          duration={duration}
          onScrub={scrub}
          onScrubEnd={release}
        />
        <BufferedRange scrubbed={scrubbed} />
      </View>
      <View className="mt-1 flex-row justify-between">
        <WashText variant="caption" tone="muted" numeric>
          {clock(shown)}
        </WashText>
        <WashText variant="caption" tone="muted" numeric>
          -{clock(Math.max(duration - shown, 0))}
        </WashText>
      </View>
    </View>
  );
}
