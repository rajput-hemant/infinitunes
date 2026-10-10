import { formatDuration } from "@infinitunes/types";
import { Slider } from "@infinitunes/ui/components/slider";
import * as React from "react";

import { usePosition } from "~/lib/position-store";
import type { PositionStore } from "~/lib/position-store";
import { cn } from "~/lib/utils";

import { scrubClass, sliderValueOf, useSliderValueText } from "./controls";

type ExpandedSeekProps = {
  position: PositionStore;
  duration: number;
  onSeekStart: () => void;
  onSeekChange: (value: number) => void;
  onSeekCommit: () => void;
};

/** Owns the per-frame position subscription so `ExpandedBody` stays still. */
export function ExpandedSeek({
  position,
  duration,
  onSeekStart,
  onSeekChange,
  onSeekCommit,
}: ExpandedSeekProps) {
  const pos = usePosition(position);
  const seekLabelId = React.useId();
  const format = duration >= 3600 ? "hh:mm:ss" : "mm:ss";
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
        <span>{formatDuration(duration, format)}</span>
      </div>
    </div>
  );
}
