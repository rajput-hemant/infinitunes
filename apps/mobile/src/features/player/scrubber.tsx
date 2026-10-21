import { formatDuration } from "@infinitunes/types";
import { useRef, useState } from "react";
import { View } from "react-native";

import {
  usePlaybackPosition,
  usePlaybackStatus,
} from "~/playback/playback-status";
import { seekTo } from "~/playback/transport";

import { SeekSlider } from "./seek-slider";
import { useWashColors, WashText } from "./wash";

/** What a screen reader's swipe up or down seeks by, in seconds. */
export const SEEK_STEP_SECONDS = 10;

/**
 * The full player's seek bar with elapsed and remaining time. While the
 * listener drags it shows the dragged position, and seeks once on release.
 */
export function Scrubber() {
  const position = usePlaybackPosition();
  const duration = usePlaybackStatus((state) => state.duration);
  const wash = useWashColors();
  const [scrubbed, setScrubbed] = useState<number | null>(null);
  const scrubbedRef = useRef<number | null>(null);
  const shown = scrubbed ?? position;

  function scrub(value: number) {
    scrubbedRef.current = value;
    setScrubbed(value);
  }

  function release() {
    if (scrubbedRef.current !== null) seekTo(scrubbedRef.current);
    scrubbedRef.current = null;
    setScrubbed(null);
  }

  /** Screen readers cannot drag the native slider: they step the position instead. */
  function step(direction: 1 | -1) {
    const next = position + direction * SEEK_STEP_SECONDS;
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
      <SeekSlider
        value={Math.min(shown, duration)}
        max={Math.max(duration, 1)}
        onScrub={scrub}
        onScrubEnd={release}
        colors={
          wash ? { active: wash.accent, inactive: wash.track } : undefined
        }
      />
      <View className="mt-1 flex-row justify-between">
        <WashText variant="caption" tone="muted" numeric>
          {formatDuration(shown, "mm:ss")}
        </WashText>
        <WashText variant="caption" tone="muted" numeric>
          -{formatDuration(Math.max(duration - shown, 0), "mm:ss")}
        </WashText>
      </View>
    </View>
  );
}
