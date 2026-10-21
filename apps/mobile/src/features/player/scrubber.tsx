import { formatDuration } from "@infinitunes/types";
import { useRef, useState } from "react";
import { View } from "react-native";

import { Text } from "~/components/ui/text";
import {
  usePlaybackPosition,
  usePlaybackStatus,
} from "~/playback/playback-status";
import { seekTo } from "~/playback/transport";

import { SeekSlider } from "./seek-slider";

/** What a screen reader's swipe up or down seeks by, in seconds. */
export const SEEK_STEP_SECONDS = 10;

/**
 * The full player's seek bar with elapsed and remaining time. While the
 * listener drags it shows the dragged position, and seeks once on release.
 */
export function Scrubber() {
  const position = usePlaybackPosition();
  const duration = usePlaybackStatus((state) => state.duration);
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
      />
      <View className="flex-row justify-between">
        <Text variant="caption" tone="muted">
          {formatDuration(shown, "mm:ss")}
        </Text>
        <Text variant="caption" tone="muted">
          -{formatDuration(Math.max(duration - shown, 0), "mm:ss")}
        </Text>
      </View>
    </View>
  );
}
