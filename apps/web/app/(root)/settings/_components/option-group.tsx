import React from "react";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

export type OptionGroupItem<T extends string | number> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
  /** Renders a sample glyph above the label, set in `fontFamily`. */
  preview?: { text: string; fontFamily: string };
  style?: React.CSSProperties;
};

type OptionGroupProps<T extends string | number> = {
  label: string;
  value: T | undefined;
  onValueChange: (value: T) => void;
  options: readonly OptionGroupItem<T>[];
  className?: string;
};

export function OptionGroup<T extends string | number>(
  props: OptionGroupProps<T>,
) {
  const { label, value, onValueChange, options, className } = props;
  const name = React.useId();

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => (
        <label
          key={option.value}
          style={option.style}
          className={cn(
            controlStyles.text,
            "relative inline-flex min-w-20 cursor-pointer items-center justify-center gap-2 rounded-sm bg-fill px-3 text-sm/5 font-medium ease-spring transition-[background-color,box-shadow,transform] duration-fast select-none hover:bg-fill-2 active:scale-[0.96] has-checked:bg-primary/10 has-checked:inset-ring-2 has-checked:inset-ring-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring max-sm:flex-1 max-sm:basis-2/5",
            option.preview &&
              "h-auto min-h-15 min-w-30 flex-col gap-0 py-2 text-xs/4 text-muted-foreground has-checked:text-foreground",
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onValueChange(option.value)}
            className="sr-only"
          />
          {option.icon}
          {option.preview && (
            <b
              aria-hidden
              style={{ fontFamily: option.preview.fontFamily }}
              className="text-xl/7 font-semibold text-foreground"
            >
              {option.preview.text}
            </b>
          )}
          {option.label}
        </label>
      ))}
    </div>
  );
}
