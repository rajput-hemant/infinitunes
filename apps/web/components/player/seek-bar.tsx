import { usePosition } from "@infinitunes/core/react/position-store";
import type { PositionStore } from "@infinitunes/core/react/position-store";
import { formatDuration } from "@infinitunes/types";
import { Slider } from "@infinitunes/ui/components/slider";
import * as React from "react";

import { scrubClass, sliderValueOf, useSliderValueText } from "./controls";
import { DurationToggle, durationFormatFor } from "./duration-toggle";

type SeekBarProps = {
  position: PositionStore;
  duration: number;
  showRemainingTime: boolean;
  onToggleRemainingTime: () => void;
  onChange: (value: number) => void;
  onCommit: () => void;
  onStart: () => void;
};

// The only parts that follow the playhead every frame (PF-8); the rest of the
// bar re-renders on real state changes only.
export function SeekBar({
  position,
  duration,
  showRemainingTime,
  onToggleRemainingTime,
  onChange,
  onCommit,
  onStart,
}: SeekBarProps) {
  const pos = usePosition(position);
  const labelId = React.useId();
  const format = durationFormatFor(duration);
  const ref = useSliderValueText(
    `${formatDuration(pos, format)} of ${formatDuration(duration, format)}`,
  );

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
        onValueChange={(value: number | readonly number[]) =>
          onChange(sliderValueOf(value))
        }
        onValueCommitted={onCommit}
        onPointerDown={onStart}
        className={scrubClass}
      />
      <DurationToggle
        position={position}
        duration={duration}
        format={format}
        showRemaining={showRemainingTime}
        onToggle={onToggleRemainingTime}
      />
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
