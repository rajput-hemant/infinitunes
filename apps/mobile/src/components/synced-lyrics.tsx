import { activeLineIndex } from "@infinitunes/core/lyrics";
import type { LyricLine } from "@infinitunes/core/lyrics";
import { memo, useCallback, useEffect, useRef } from "react";
import type { ScrollViewInstance } from "react-native";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";

import { Text } from "~/components/ui/text";
import { usePlaybackPosition } from "~/playback/playback-status";
import { usePlayer } from "~/playback/player-store";
import { seekTo } from "~/playback/transport";
import { space } from "~/theme/tokens";

type Props = {
  lines: LyricLine[];
  songId: string;
  height: number;
  foreground?: string;
  muted?: string;
  /**
   * Now Playing's large lines: `title2` emphasized, every line in the
   * foreground, the inactive ones dimmed and fading as the active line moves.
   */
  prominent?: boolean;
};

/** A prominent inactive line's opacity: the foreground, dimmed. */
const INACTIVE_OPACITY = 0.55;

/**
 * A prominent line's dim fades. Only the opacity changes, so it stays under
 * reduce motion (CSS transitions do not read it, and need not).
 */
const LINE_FADE = {
  transitionProperty: "opacity",
  transitionDuration: 200,
} as const;

export function SyncedLyrics(props: Props) {
  const position = usePlaybackPosition();
  const playingId = usePlayer((state) => state.queue[state.currentIndex]?.id);
  return (
    <TimedLines
      {...props}
      active={
        playingId === props.songId ? activeLineIndex(props.lines, position) : -1
      }
      canSeek={playingId === props.songId}
    />
  );
}

const Line = memo(function Line({
  line,
  active,
  canSeek,
  foreground,
  muted,
  prominent,
}: {
  line: LyricLine;
  active: boolean;
  canSeek: boolean;
  foreground?: string;
  muted?: string;
  prominent?: boolean;
}) {
  const text = prominent ? (
    <Animated.View
      style={[{ opacity: active ? 1 : INACTIVE_OPACITY }, LINE_FADE]}
      testID={active ? "lyric-line-active" : undefined}
    >
      <Text variant="title2" emphasized color={foreground}>
        {line.text || "♪"}
      </Text>
    </Animated.View>
  ) : (
    <Text
      variant="headline"
      tone={active ? "default" : "muted"}
      color={active ? foreground : muted}
    >
      {line.text || "♪"}
    </Text>
  );
  return canSeek ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Seek to ${line.text || "instrumental break"}`}
      accessibilityState={{ selected: active }}
      onPress={() => seekTo(line.time)}
      className="min-h-touch justify-center py-2"
    >
      {text}
    </Pressable>
  ) : (
    text
  );
});

const TimedLines = memo(function TimedLines({
  lines,
  active,
  canSeek,
  height,
  foreground,
  muted,
  prominent,
}: Props & { active: number; canSeek: boolean }) {
  const scroll = useRef<ScrollViewInstance>(null);
  const offsets = useRef(new Map<number, number>());
  const paused = useRef(false);
  const resume = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(active);
  const reduceMotion = useReducedMotion();

  const follow = useCallback(() => {
    const y = offsets.current.get(activeRef.current);
    if (!paused.current && y !== undefined)
      scroll.current?.scrollTo({
        y: Math.max(0, y - height / 3),
        animated: !reduceMotion,
      });
  }, [height, reduceMotion]);
  function pause() {
    paused.current = true;
    if (resume.current) clearTimeout(resume.current);
  }
  function resumeLater() {
    pause();
    resume.current = setTimeout(() => {
      paused.current = false;
      follow();
    }, 4000);
  }
  useEffect(() => {
    activeRef.current = active;
    follow();
  }, [active, follow]);
  useEffect(
    () => () => {
      if (resume.current) clearTimeout(resume.current);
    },
    [],
  );

  return (
    <ScrollView
      ref={scroll}
      style={{ height }}
      contentContainerStyle={{
        // Prominent lines sit under a faded top edge: the first starts below it.
        paddingTop: prominent ? space.xxl : 0,
        paddingBottom: height / 2,
        gap: space.sm,
      }}
      accessibilityLabel="Synced lyrics"
      nestedScrollEnabled
      onScrollBeginDrag={pause}
      onScrollEndDrag={resumeLater}
      onMomentumScrollBegin={() => {
        if (paused.current) pause();
      }}
      onMomentumScrollEnd={() => {
        if (paused.current) resumeLater();
      }}
    >
      {lines.map((line, index) => (
        <View
          key={`${line.time}-${index}`}
          onLayout={(event) => {
            offsets.current.set(index, event.nativeEvent.layout.y);
            if (index === activeRef.current) follow();
          }}
        >
          <Line
            line={line}
            active={index === active}
            canSeek={canSeek}
            foreground={foreground}
            muted={muted}
            prominent={prominent}
          />
        </View>
      ))}
    </ScrollView>
  );
});
