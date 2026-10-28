"use client";

/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- Lyrics scroll regions need keyboard access even without seek buttons. */

import {
  activeLineIndex,
  lyricScrollTop,
  LYRICS_FOLLOW_DELAY_MS,
} from "@infinitunes/core/lyrics";
import type { LyricLine } from "@infinitunes/core/lyrics";
import type { PositionStore } from "@infinitunes/core/react/position-store";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

import { cn } from "~/lib/utils";

type Props = {
  lines: LyricLine[];
  position: PositionStore;
  onSeek?: (seconds: number) => void;
  prominent?: boolean;
};

export function SyncedLyrics({ lines, position, onSeek, prominent }: Props) {
  const active = useSyncExternalStore(
    position.subscribe,
    () => activeLineIndex(lines, position.get()),
    () => -1,
  );
  return (
    <>
      <output className="sr-only" aria-live="polite" aria-atomic="true">
        {active >= 0 ? lines[active]?.text || "Instrumental break" : ""}
      </output>
      <TimedLines
        lines={lines}
        active={active}
        onSeek={onSeek}
        prominent={prominent}
      />
    </>
  );
}

const Line = memo(function Line({
  line,
  active,
  onSeek,
  prominent,
}: {
  line: LyricLine;
  active: boolean;
  onSeek: Props["onSeek"];
  prominent?: boolean;
}) {
  const className = cn(
    "block min-h-12 w-full rounded-md px-2 py-2 text-left font-semibold break-words transition-[opacity,color] duration-base",
    prominent
      ? "text-2xl/9 text-foreground md:text-3xl/10"
      : "text-lg/7 text-muted-foreground",
    prominent && !active && "opacity-55",
    active && "text-foreground",
  );
  return onSeek ? (
    <button
      type="button"
      aria-label={`Seek to ${line.text || "instrumental break"}`}
      aria-current={active ? "true" : undefined}
      onClick={() => onSeek(line.time)}
      className={cn(
        className,
        "cursor-pointer hover:bg-fill focus-visible:outline-2 focus-visible:outline-foreground",
      )}
    >
      {line.text || "♪"}
    </button>
  ) : (
    <p className={className}>{line.text || "♪"}</p>
  );
});

const TimedLines = memo(function TimedLines({
  lines,
  active,
  onSeek,
  prominent,
}: Omit<Props, "position"> & { active: number }) {
  const container = useRef<HTMLElement>(null);
  const paused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(active);

  const follow = useCallback(() => {
    const host = container.current;
    if (host) host.style.paddingBottom = `${(host.clientHeight * 2) / 3}px`;
    const line = host?.children.item(activeRef.current);
    if (paused.current || !host || !(line instanceof HTMLElement)) return;
    host.scrollTo({
      top: lyricScrollTop(line.offsetTop, host.clientHeight),
      behavior:
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        document.documentElement.dataset.motion === "reduced"
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
    }, LYRICS_FOLLOW_DELAY_MS);
  }
  useEffect(() => {
    activeRef.current = active;
    follow();
  }, [active, follow]);
  useEffect(() => {
    const host = container.current;
    if (!host || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(follow);
    observer.observe(host);
    return () => observer.disconnect();
  }, [follow]);
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
      tabIndex={0}
      className="relative h-full min-h-0 overflow-y-auto overscroll-contain pt-8 pb-24 [mask-image:linear-gradient(to_bottom,transparent,black_2rem,black_calc(100%-2rem),transparent)] forced-colors:[mask-image:none]"
      onWheel={pause}
      onTouchMove={pause}
      onPointerDown={() => {
        paused.current = true;
        if (timer.current) clearTimeout(timer.current);
      }}
      onPointerUp={pause}
      onPointerCancel={pause}
      onTouchEnd={pause}
      onScroll={() => {
        if (paused.current) pause();
      }}
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
          prominent={prominent}
        />
      ))}
    </section>
  );
});
