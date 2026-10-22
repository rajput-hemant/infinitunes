import { formatDuration } from "@infinitunes/types";
import { useRef, useState } from "react";
import { Platform, View } from "react-native";

import {
  usePlaybackPosition,
  usePlaybackStatus,
} from "~/playback/playback-status";
import { seekTo } from "~/playback/transport";
import { useTokenColor } from "~/theme/use-palette";

import { SeekSlider } from "./seek-slider";
import { SLIDER_HOST } from "./seek-slider-props";
import { useWashColors, WashText } from "./wash";

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

/**
 * The full player's seek bar with elapsed and remaining time. While the
 * listener drags it shows the dragged position, and seeks once on release.
 */
export function Scrubber() {
  const position = usePlaybackPosition();
  const duration = usePlaybackStatus((state) => state.duration);
  const bufferedTime = usePlaybackStatus((state) => state.bufferedTime);
  const muted = useTokenColor("muted-foreground");
  const wash = useWashColors();
  const [scrubbed, setScrubbed] = useState<number | null>(null);
  const scrubbedRef = useRef<number | null>(null);
  const shown = scrubbed ?? position;
  const played = duration > 0 ? Math.min(Math.max(shown / duration, 0), 1) : 0;
  const buffered =
    duration > 0 ? Math.min(Math.max(bufferedTime / duration, 0), 1) : 0;

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
      <View>
        <SeekSlider
          value={Math.min(shown, duration)}
          max={Math.max(duration, 1)}
          onScrub={scrub}
          onScrubEnd={release}
          colors={
            wash ? { active: wash.accent, inactive: wash.track } : undefined
          }
        />
        {/* The loaded range as a lighter part of the native track, from the thumb's far edge on. */}
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
          <View
            testID="scrubber-buffered"
            style={{
              left: `${played * 100}%`,
              width: `${Math.max(buffered - played, 0) * 100}%`,
            }}
          >
            <View
              style={{
                marginLeft: TRACK.thumb / 2 + TRACK.gap,
                // Fully loaded reaches the track's own end, past the thumb's travel.
                marginRight: buffered >= 1 ? -TRACK.thumb / 2 : 0,
                height: TRACK.height,
                borderRadius: TRACK.radius,
                borderTopRightRadius:
                  buffered >= 1 ? TRACK.height / 2 : TRACK.radius,
                borderBottomRightRadius:
                  buffered >= 1 ? TRACK.height / 2 : TRACK.radius,
                backgroundColor: wash?.muted ?? muted,
                opacity: 0.45,
              }}
            />
          </View>
        </View>
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
