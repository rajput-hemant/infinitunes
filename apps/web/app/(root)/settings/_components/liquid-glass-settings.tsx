"use client";

import { GLASS_LEVELS } from "@infinitunes/types";
import type { GlassLevel } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { Switch } from "@infinitunes/ui/components/switch";
import { Layers, RotateCcw } from "lucide-react";
import React from "react";

import { useThemeConfig } from "~/hooks/use-theme-config";
import { controlStyles } from "~/lib/control-styles";
import { DEFAULT_THEME_CONFIG } from "~/lib/theme-config";

import {
  GLASS_SLIDERS,
  GLASS_VARIANTS,
  formatSliderValue,
  sliderPatch,
  sliderValue,
} from "./glass-tuning";
import type { GlassTuning } from "./glass-tuning";
import { OptionGroup } from "./option-group";
import { RangeField } from "./range-field";
import { SettingsRow } from "./settings-section";

const LEVEL_LABELS: Record<GlassLevel, string> = {
  liquid: "Liquid glass",
  subtle: "Subtle",
  solid: "Solid",
};

const VARIANT_LABELS = {
  regular: "Regular",
  clear: "Clear",
  tinted: "Tinted",
} as const;

/** Controls for the glass material fields `ThemeConfig` does not store yet. */
export type GlassTuningControls = {
  value: GlassTuning;
  onChange: (patch: Partial<GlassTuning>) => void;
  onReset: () => void;
};

type LiquidGlassSettingsProps = {
  /** Omit until the theme config can persist the fine tuning; the section then shows level and ambient only. */
  tuning?: GlassTuningControls;
};

export function LiquidGlassSettings({ tuning }: LiquidGlassSettingsProps) {
  const {
    config: { glass, ambient },
    update,
  } = useThemeConfig();
  const ambientLabelId = React.useId();
  const isSolid = glass === "solid";
  const isDefault =
    glass === DEFAULT_THEME_CONFIG.glass &&
    ambient === DEFAULT_THEME_CONFIG.ambient;

  return (
    <div className="grid gap-4">
      <OptionGroup
        label="Glass level"
        value={glass}
        onValueChange={(next) => update({ glass: next })}
        options={GLASS_LEVELS.map((level) => ({
          value: level,
          label: LEVEL_LABELS[level],
          icon:
            level === "liquid" ? (
              <Layers aria-hidden className="size-4" />
            ) : undefined,
        }))}
      />

      <div className="grid max-w-2xl gap-4 rounded-md border border-line p-4">
        <h3 className="font-heading text-base font-semibold">Liquid Glass</h3>

        <div
          aria-hidden
          className="relative isolate grid h-40 place-items-center overflow-hidden rounded-md bg-card"
        >
          <i className="absolute top-3 left-6 -z-10 size-20 rounded-full bg-primary/70 blur-xl" />
          <i className="absolute right-8 bottom-2 -z-10 size-24 rounded-full bg-primary/40 blur-xl" />
          <div className="grid gap-0.5 rounded-md border border-line bg-card/60 px-4 py-2 text-center">
            <b>Now Playing</b>
            <small className="text-muted-foreground">
              {LEVEL_LABELS[glass]}
            </small>
          </div>
        </div>

        {tuning && (
          <fieldset
            disabled={isSolid}
            className="grid gap-4 disabled:opacity-50"
          >
            <legend className="sr-only">Liquid Glass tuning</legend>

            <SettingsRow
              label="Variant"
              help="Applies to the player, tab bar and toolbar. Menus, dialogs and the sidebar stay Regular for legibility."
              className="border-b-0 py-0"
            >
              <OptionGroup
                label="Glass variant"
                value={tuning.value.variant}
                onValueChange={(variant) => tuning.onChange({ variant })}
                options={GLASS_VARIANTS.map((variant) => ({
                  value: variant,
                  label: VARIANT_LABELS[variant],
                }))}
              />
            </SettingsRow>

            {GLASS_SLIDERS.map((slider) => (
              <RangeField
                key={slider.key}
                label={slider.label}
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={sliderValue(slider, tuning.value)}
                format={(shown) => formatSliderValue(slider, shown)}
                onValueChange={(shown) =>
                  tuning.onChange(sliderPatch(slider, shown))
                }
              />
            ))}

            <SettingsRow
              label="Tint follows accent"
              help="Mix the accent colour into the glass tint."
              className="border-b-0 py-0"
            >
              <Switch
                aria-label="Tint follows accent"
                checked={tuning.value.accentTint}
                onCheckedChange={(accentTint) =>
                  tuning.onChange({ accentTint })
                }
              />
            </SettingsRow>
          </fieldset>
        )}

        <SettingsRow
          label="Ambient background"
          labelId={ambientLabelId}
          help="A colour field from the playing artwork that the glass refracts."
          className="border-b-0 py-0"
        >
          <Switch
            aria-labelledby={ambientLabelId}
            checked={ambient}
            onCheckedChange={(next) => update({ ambient: next })}
          />
        </SettingsRow>

        <div>
          <Button
            variant="outline"
            disabled={isDefault && !tuning}
            onClick={() => {
              update({
                glass: DEFAULT_THEME_CONFIG.glass,
                ambient: DEFAULT_THEME_CONFIG.ambient,
              });
              tuning?.onReset();
            }}
            className={controlStyles.text}
          >
            <RotateCcw aria-hidden className="size-4" />
            Reset glass
          </Button>
        </div>
      </div>
    </div>
  );
}
