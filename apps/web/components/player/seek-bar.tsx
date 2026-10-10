import { formatDuration } from "@infinitunes/types";
import { Slider } from "@infinitunes/ui/components/slider";
import * as React from "react";

import { usePosition } from "~/lib/position-store";
import type { PositionStore } from "~/lib/position-store";

import { scrubClass, setValueText } from "./controls";

type SeekBarProps = {
  position: PositionStore;
  duration: number;
  onChange: (value: number) => void;
  onCommit: () => void;
  onStart: () => void;
};

// The only parts that follow the playhead every frame (PF-8); the rest of the
// bar re-renders on real state changes only.
export function SeekBar({
  position,
  duration,
  onChange,
  onCommit,
  onStart,
}: SeekBarProps) {
  const pos = usePosition(position);
  const labelId = React.useId();
  const ref = React.useRef<HTMLDivElement>(null);
  const format = duration >= 3600 ? "hh:mm:ss" : "mm:ss";
  const text = `${formatDuration(pos, format)} of ${formatDuration(duration, format)}`;

  // The Slider wrapper does not forward per-thumb props, so the readable value
  // is set on the thumb's range input directly (see `setValueText`).
  React.useEffect(() => setValueText(ref.current, text), [text]);

  return (
    <div className="flex w-full min-w-0 items-center gap-2 text-xs/4 tabular-nums text-muted-foreground">
      <span aria-hidden>{formatDuration(pos, format)}</span>
      <span id={labelId} className="sr-only">
        Seek
      </span>
      <Slider
        ref={ref}
        aria-labelledby={labelId}
        value={[pos]}
        max={duration || 1}
        onValueChange={(value: number | readonly number[], _details) =>
          onChange(typeof value === "number" ? value : (value[0] as number))
        }
        onValueCommitted={onCommit}
        onPointerDown={onStart}
        className={scrubClass}
      />
      <span aria-hidden>{formatDuration(duration, format)}</span>
    </div>
  );
}

type MiniProgressProps = { position: PositionStore; duration: number };

/** The 2px progress line along the bottom of the phone pill. */
export function MiniProgress({ position, duration }: MiniProgressProps) {
  const progress = usePosition(position);
  return (
    <div
      aria-hidden
      className="absolute inset-x-4 bottom-0 h-0.5 overflow-hidden rounded-full bg-fill-2 md:hidden"
    >
      <div
        className="h-full bg-foreground"
        style={{
          width: `${duration > 0 ? Math.min(100, (progress / duration) * 100) : 0}%`,
        }}
      />
    </div>
  );
}
