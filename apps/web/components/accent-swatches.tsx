"use client";

import { Check } from "lucide-react";
import { useRef } from "react";
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
  const group = useRef<HTMLDivElement>(null);
  // Roving tabindex: the selected swatch, or the first when none is selected.
  const tabbable = themes.some((theme) => theme.name === accent)
    ? accent
    : themes[0].name;

  // Menus and sheets handle arrow keys themselves; keep them for the group.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
      event.key
    ];
    if (!step) return;
    event.preventDefault();
    event.stopPropagation();
    const radios = Array.from(
      group.current?.querySelectorAll<HTMLButtonElement>("[role=radio]") ?? [],
    );
    const index = radios.findIndex((radio) => radio === document.activeElement);
    const next = radios[(index + step + radios.length) % radios.length];
    next?.focus();
    next?.click();
  }

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label="Accent color"
      onKeyDown={onKeyDown}
      className={cn("grid grid-cols-6", className)}
    >
      {themes.map((theme) => {
        const selected = accent === theme.name;
        return (
          <button
            key={theme.name}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={theme.label}
            title={theme.label}
            tabIndex={theme.name === tabbable ? 0 : -1}
            onClick={() => update({ accent: theme.name })}
            className="group/swatch grid h-(--ctl-lg) place-items-center rounded-(--r-ctl) outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              style={{ backgroundColor: theme.hex }}
              className={cn(
                "grid size-5 place-items-center rounded-full text-white transition-transform duration-fast ease-spring group-hover/swatch:scale-110 group-active/swatch:scale-95",
                selected
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-popover"
                  : "ring-1 ring-foreground/15 ring-inset",
              )}
            >
              {selected ? (
                <Check aria-hidden className="size-3 mix-blend-difference" />
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
