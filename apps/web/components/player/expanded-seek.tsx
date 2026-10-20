import { usePosition } from "@infinitunes/core/react/position-store";
import type { PositionStore } from "@infinitunes/core/react/position-store";
import { formatDuration } from "@infinitunes/types";
import { Slider } from "@infinitunes/ui/components/slider";
import * as React from "react";

import { cn } from "~/lib/utils";

import { scrubClass, sliderValueOf, useSliderValueText } from "./controls";
import { DurationToggle, durationFormatFor } from "./duration-toggle";

type ExpandedSeekProps = {
  position: PositionStore;
  duration: number;
  showRemainingTime: boolean;
  onToggleRemainingTime: () => void;
  onSeekStart: () => void;
  onSeekChange: (value: number) => void;
  onSeekCommit: () => void;
};

/** Owns the per-frame position subscription so `ExpandedBody` stays still. */
export function ExpandedSeek({
  position,
  duration,
  showRemainingTime,
  onToggleRemainingTime,
  onSeekStart,
  onSeekChange,
  onSeekCommit,
}: ExpandedSeekProps) {
  const pos = usePosition(position);
  const seekLabelId = React.useId();
  const format = durationFormatFor(duration);
  const seekRef = useSliderValueText(
    `${formatDuration(pos, format)} of ${formatDuration(duration, format)}`,
  );

  return (
    <div className="space-y-2">
      <span id={seekLabelId} className="sr-only">
        Seek
      </span>
      <Slider
        ref={seekRef}
        aria-labelledby={seekLabelId}
        value={[pos]}
        max={duration || 1}
        onValueChange={(value: number | readonly number[]) =>
          onSeekChange(sliderValueOf(value))
        }
        onValueCommitted={onSeekCommit}
        onPointerDown={onSeekStart}
        className={cn(scrubClass, "[&>*]:py-3")}
      />
      <div className="flex justify-between text-xs/4 tabular-nums text-muted-foreground">
        <span>{formatDuration(pos, format)}</span>
        <DurationToggle
          position={position}
          duration={duration}
          format={format}
          showRemaining={showRemainingTime}
          onToggle={onToggleRemainingTime}
        />
      </div>
    </div>
  );
}
