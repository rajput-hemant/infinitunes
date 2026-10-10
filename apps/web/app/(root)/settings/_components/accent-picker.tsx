"use client";

import { Input } from "@infinitunes/ui/components/input";
import React from "react";

import { themes } from "~/config/themes";
import { useThemeConfig } from "~/hooks/use-theme-config";
import { controlStyles } from "~/lib/control-styles";
import { resolveAccentHex } from "~/lib/theme/html";
import { cn } from "~/lib/utils";

import { accentPatch, isPresetAccent } from "./appearance-options";

const swatchStyles =
  "relative size-8 cursor-pointer rounded-full ease-spring transition-transform duration-fast hover:scale-110 active:scale-[0.96] has-checked:ring-2 has-checked:ring-primary has-checked:ring-offset-4 has-checked:ring-offset-background has-focus-visible:outline-2 has-focus-visible:outline-offset-8 has-focus-visible:outline-ring";

export function AccentPicker() {
  const {
    config: { accent },
    update,
  } = useThemeConfig();
  const [draft, setDraft] = React.useState<string | null>(null);
  const name = React.useId();

  const hex = resolveAccentHex(accent);
  const isCustom = !isPresetAccent(accent);
  const invalid = draft !== null && accentPatch(draft) === null;

  function onHexChange(value: string) {
    setDraft(value);
    const patch = accentPatch(value);
    if (patch) update(patch);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        role="radiogroup"
        aria-label="Accent color"
        className="flex flex-wrap items-center gap-3"
      >
        {themes.map((theme) => (
          <label
            key={theme.name}
            title={theme.label}
            style={{ backgroundColor: theme.hex }}
            className={swatchStyles}
          >
            <input
              type="radio"
              name={name}
              value={theme.name}
              checked={accent === theme.name}
              onChange={() => {
                setDraft(null);
                update({ accent: theme.name });
              }}
              className="sr-only"
            />
            <span className="sr-only">{theme.label}</span>
          </label>
        ))}
      </div>

      <label
        title="Custom color"
        className={cn(
          swatchStyles,
          "overflow-hidden bg-[conic-gradient(var(--color-red-500),var(--color-yellow-400),var(--color-lime-400),var(--color-cyan-400),var(--color-blue-500),var(--color-fuchsia-500),var(--color-red-500))]",
          isCustom &&
            "ring-2 ring-primary ring-offset-4 ring-offset-background",
        )}
      >
        <input
          type="color"
          value={hex}
          onChange={(event) => {
            setDraft(null);
            update({ accent: event.currentTarget.value });
          }}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
        <span className="sr-only">Custom color</span>
      </label>

      <Input
        aria-label="Accent hex color"
        aria-invalid={invalid}
        spellCheck={false}
        autoComplete="off"
        maxLength={7}
        value={draft ?? hex.toUpperCase()}
        onChange={(event) => onHexChange(event.currentTarget.value)}
        onBlur={() => setDraft(null)}
        className={cn(controlStyles.text, "w-28 font-mono")}
      />
    </div>
  );
}
