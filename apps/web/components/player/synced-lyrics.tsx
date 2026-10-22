"use client";

import { activeLineIndex } from "@infinitunes/core/lyrics";
import type { LyricLine } from "@infinitunes/core/lyrics";
import { usePosition } from "@infinitunes/core/react/position-store";
import type { PositionStore } from "@infinitunes/core/react/position-store";
import { memo, useCallback, useEffect, useRef } from "react";

import { cn } from "~/lib/utils";

type Props = {
  lines: LyricLine[];
  position: PositionStore;
  onSeek: (seconds: number) => void;
};

export function SyncedLyrics({ lines, position, onSeek }: Props) {
  const seconds = usePosition(position);
  return (
    <TimedLines
      lines={lines}
      active={activeLineIndex(lines, seconds)}
      onSeek={onSeek}
    />
  );
}

const Line = memo(function Line({
  line,
  active,
  onSeek,
}: {
  line: LyricLine;
  active: boolean;
  onSeek: Props["onSeek"];
}) {
  return (
    <button
      type="button"
      aria-label={`Seek to ${line.text || "instrumental break"}`}
      aria-current={active ? "true" : undefined}
      onClick={() => onSeek(line.time)}
      className={cn(
        "min-h-12 w-full rounded-md px-2 py-2 text-left text-lg/7 font-semibold text-muted-foreground focus-visible:outline-2",
        active && "text-foreground",
      )}
    >
      {line.text || "♪"}
    </button>
  );
});

const TimedLines = memo(function TimedLines({
  lines,
  active,
  onSeek,
}: Omit<Props, "position"> & { active: number }) {
  const container = useRef<HTMLElement>(null);
  const paused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(active);

  const follow = useCallback(() => {
    const host = container.current;
    const line = host?.children.item(activeRef.current);
    if (paused.current || !host || !(line instanceof HTMLElement)) return;
    host.scrollTo({
      top: Math.max(0, line.offsetTop - host.offsetTop - host.clientHeight / 3),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, []);
  function pause() {
    paused.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
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
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <section
      ref={container}
      aria-label="Synced lyrics"
      className="relative h-full min-h-0 overflow-y-auto pb-24"
      onWheel={pause}
      onTouchMove={pause}
      onPointerDown={pause}
      onKeyDownCapture={(event) => {
        if (
          [
            "ArrowDown",
            "ArrowUp",
            "PageDown",
            "PageUp",
            "Home",
            "End",
          ].includes(event.key)
        )
          pause();
      }}
    >
      {lines.map((line, index) => (
        <Line
          key={`${line.time}-${index}`}
          line={line}
          active={active === index}
          onSeek={onSeek}
        />
      ))}
    </section>
  );
});
