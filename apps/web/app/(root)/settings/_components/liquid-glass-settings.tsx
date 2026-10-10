"use client";

import { GLASS_LEVELS, GLASS_VARIANTS } from "@infinitunes/types";
import type { GlassLevel, GlassTuning, GlassVariant } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { Switch } from "@infinitunes/ui/components/switch";
import { Layers, RotateCcw } from "lucide-react";
import { useTheme } from "next-themes";
import { useId } from "react";

import { useThemeConfig } from "~/hooks/use-theme-config";
import { controlStyles } from "~/lib/control-styles";
import { DEFAULT_GLASS_TUNING, DEFAULT_THEME_CONFIG } from "~/lib/theme-config";

import { GlassDemo } from "./glass-demo";
import {
  GLASS_SLIDERS,
  formatSliderValue,
  isDefaultGlassTuning,
  resolveGlassTuning,
  sliderPatch,
  sliderValue,
} from "./glass-tuning";
import { OptionGroup } from "./option-group";
import { RangeField } from "./range-field";
import { SettingsRow } from "./settings-section";

const LEVEL_LABELS: Record<GlassLevel, string> = {
  liquid: "Liquid glass",
  subtle: "Subtle",
  solid: "Solid",
};

const VARIANT_LABELS: Record<GlassVariant, string> = {
  regular: "Regular",
  clear: "Clear",
  tinted: "Tinted",
};

/** Glass level, the tuning sliders and the ambient field, all stored in the theme config. */
export function LiquidGlassSettings() {
  const { config, update } = useThemeConfig();
  const { resolvedTheme } = useTheme();
  const { glass, ambient, glassTuning } = config;
  const tuning = resolveGlassTuning(glassTuning, resolvedTheme === "dark");
  const ambientLabelId = useId();
  const accentTintLabelId = useId();
  const isSolid = glass === "solid";
  const isDefault =
    ambient === DEFAULT_THEME_CONFIG.ambient &&
    isDefaultGlassTuning(glassTuning);

  function tune(patch: Partial<GlassTuning>) {
    update({ glassTuning: { ...glassTuning, ...patch } });
  }

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

        <GlassDemo />

        <fieldset disabled={isSolid} className="grid gap-4 disabled:opacity-50">
          <legend className="sr-only">Liquid Glass tuning</legend>

          <SettingsRow
            label="Variant"
            help="Applies to the player, tab bar and toolbar. Menus, dialogs and the sidebar stay Regular for legibility."
            className="border-b-0 py-0"
          >
            <OptionGroup
              label="Glass variant"
              value={glassTuning.variant}
              onValueChange={(variant) => tune({ variant })}
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
              value={sliderValue(slider, tuning)}
              format={(shown) => formatSliderValue(slider, shown)}
              onValueChange={(shown) => tune(sliderPatch(slider, shown))}
            />
          ))}

          <SettingsRow
            label="Tint follows accent"
            labelId={accentTintLabelId}
            help="Mix the accent colour into the glass tint."
            className="border-b-0 py-0"
          >
            <Switch
              aria-labelledby={accentTintLabelId}
              checked={glassTuning.accentTint}
              onCheckedChange={(accentTint) => tune({ accentTint })}
            />
          </SettingsRow>
        </fieldset>

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
            disabled={isDefault}
            onClick={() =>
              update({
                ambient: DEFAULT_THEME_CONFIG.ambient,
                glassTuning: DEFAULT_GLASS_TUNING,
              })
            }
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
