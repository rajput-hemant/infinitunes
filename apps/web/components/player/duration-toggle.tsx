"use client";

import { formatDuration } from "@infinitunes/types";
import * as React from "react";

import { usePosition } from "~/lib/position-store";
import type { PositionStore } from "~/lib/position-store";
import { cn } from "~/lib/utils";

export type DurationFormat = "hh:mm:ss" | "mm:ss";

export function durationFormatFor(seconds: number): DurationFormat {
  return seconds >= 3600 ? "hh:mm:ss" : "mm:ss";
}

type DurationToggleProps = {
  position: PositionStore;
  duration: number;
  format: DurationFormat;
  showRemaining: boolean;
  onToggle: () => void;
  className?: string;
};

/** End-of-track time: total length, or remaining time as a negative value. */
export function DurationToggle({
  position,
  duration,
  format,
  showRemaining,
  onToggle,
  className,
}: DurationToggleProps) {
  const pos = usePosition(position);
  const remaining = Math.max(0, duration - Math.floor(pos));
  const totalLabel = formatDuration(duration, format);
  const remainingLabel = formatDuration(remaining, format);

  return (
    <button
      type="button"
      className={cn(
        "inline-flex tabular-nums text-inherit hover:text-foreground",
        className,
      )}
      aria-pressed={showRemaining}
      aria-label={
        showRemaining
          ? `Remaining time ${remainingLabel}. Show total duration ${totalLabel}`
          : `Total duration ${totalLabel}. Show remaining time`
      }
      onClick={onToggle}
    >
      <span aria-hidden>
        {showRemaining ? `-${remainingLabel}` : `\u2007${totalLabel}`}
      </span>
    </button>
  );
}
