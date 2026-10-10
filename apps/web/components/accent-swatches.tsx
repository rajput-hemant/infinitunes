"use client";

import { Check } from "lucide-react";
import { useId } from "react";
import type { KeyboardEvent } from "react";

import { themes } from "~/config/themes";
import { useThemeConfig } from "~/hooks/use-theme-config";
import { cn } from "~/lib/utils";

type AccentSwatchesProps = {
  className?: string;
};

/**
 * Compact accent presets for menus. Same presets and the same `update` path as
 * Settings > Appearance, so a pick applies at once and is saved to the cookie
 * (guests included). A custom accent leaves every swatch unselected.
 */
export function AccentSwatches({ className }: AccentSwatchesProps) {
  const {
    config: { accent },
    update,
  } = useThemeConfig();
  const name = useId();

  // Menus and sheets move focus on arrow keys themselves. Keep those keys for
  // the native radios, which step and select through the group on their own.
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key.startsWith("Arrow")) event.stopPropagation();
  }

  return (
    <fieldset className={cn("grid grid-cols-6", className)}>
      <legend className="sr-only">Accent color</legend>
      {themes.map((theme) => {
        const selected = accent === theme.name;
        return (
          <label
            key={theme.name}
            title={theme.label}
            className="group/swatch grid h-(--ctl-lg) cursor-pointer place-items-center rounded-(--r-ctl) has-focus-visible:ring-2 has-focus-visible:ring-ring"
          >
            <input
              type="radio"
              name={name}
              value={theme.name}
              checked={selected}
              onChange={() => update({ accent: theme.name })}
              onKeyDown={onKeyDown}
              className="sr-only"
            />
            <span className="sr-only">{theme.label}</span>
            <span
              aria-hidden
              style={{ backgroundColor: theme.hex }}
              className={cn(
                "grid size-5 place-items-center rounded-full text-white transition-transform duration-fast ease-spring group-hover/swatch:scale-110 group-active/swatch:scale-95",
                selected
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-popover"
                  : "ring-1 ring-foreground/15 ring-inset",
              )}
            >
              {selected ? (
                <Check className="size-3 mix-blend-difference" />
              ) : null}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
