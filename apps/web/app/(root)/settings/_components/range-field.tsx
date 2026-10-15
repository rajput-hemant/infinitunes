import React from "react";

import { cn } from "~/lib/utils";

type RangeFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  /** The row around the slider already shows the label; keep it for assistive tech only. */
  hideLabel?: boolean;
  onValueChange: (value: number) => void;
  className?: string;
};

export function RangeField(props: RangeFieldProps) {
  const {
    label,
    value,
    min,
    max,
    step,
    format,
    hideLabel,
    onValueChange,
    className,
  } = props;
  const id = React.useId();

  return (
    <div
      className={cn(
        "flex items-center gap-4",
        !hideLabel && "max-w-2xl",
        className,
      )}
    >
      <label
        htmlFor={id}
        className={cn(
          hideLabel ? "sr-only" : "w-40 shrink-0 text-muted-foreground",
        )}
      >
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(event) => onValueChange(event.currentTarget.valueAsNumber)}
        className="h-ctl-lg min-w-0 flex-1 cursor-pointer accent-primary"
      />
      <output htmlFor={id} className="w-14 text-right tabular-nums">
        {format(value)}
      </output>
    </div>
  );
}
