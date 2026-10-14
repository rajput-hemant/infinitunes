"use client";

import { GLASS_LEVELS } from "@infinitunes/types";
import type { GlassLevel, GlassTuning } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { Layers, RotateCcw } from "lucide-react";
import { useId } from "react";

import { useThemeConfig } from "~/hooks/use-theme-config";
import { controlStyles } from "~/lib/control-styles";
import {
  GLASS_PRESETS,
  GLASS_PRESET_IDS,
  matchingPreset,
} from "~/lib/glass/tuning";
import type { GlassPresetId } from "~/lib/glass/tuning";
import { DEFAULT_GLASS_TUNING } from "~/lib/theme-config";

import { GlassDemo } from "./glass-demo";
import {
  GLASS_SLIDERS,
  formatSliderValue,
  isDefaultGlassTuning,
  sliderPatch,
  sliderValue,
} from "./glass-tuning";
import { OptionGroup } from "./option-group";
import { RangeField } from "./range-field";

const LEVEL_LABELS: Record<GlassLevel, string> = {
  liquid: "Liquid glass",
  subtle: "Subtle",
  solid: "Solid",
};

/** Glass level, the lens controls and the presets, all stored in the theme config. */
export function LiquidGlassSettings() {
  const { config, update } = useThemeConfig();
  const { glass, glassTuning } = config;
  const tintColorId = useId();
  const isSolid = glass === "solid";

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

          <OptionGroup<GlassPresetId>
            label="Glass preset"
            value={matchingPreset(glassTuning) ?? undefined}
            onValueChange={(id) =>
              update({ glassTuning: { ...GLASS_PRESETS[id].tuning } })
            }
            options={GLASS_PRESET_IDS.map((id) => ({
              value: id,
              label: GLASS_PRESETS[id].label,
            }))}
          />

          {GLASS_SLIDERS.map((slider) => (
            <RangeField
              key={slider.key}
              label={slider.label}
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={sliderValue(slider, glassTuning)}
              format={(shown) => formatSliderValue(slider, shown)}
              onValueChange={(shown) => tune(sliderPatch(slider, shown))}
            />
          ))}

          <div className="flex max-w-2xl items-center gap-4">
            <label
              htmlFor={tintColorId}
              className="w-40 shrink-0 text-muted-foreground"
            >
              Tint color
            </label>
            <input
              id={tintColorId}
              type="color"
              value={glassTuning.tintColor}
              onChange={(event) =>
                tune({ tintColor: event.currentTarget.value })
              }
              className="h-ctl-lg w-full min-w-0 flex-1 cursor-pointer rounded-sm border border-line bg-transparent p-0.5"
            />
            <span className="w-14 text-right tabular-nums">
              {glassTuning.tintColor}
            </span>
          </div>
        </fieldset>

        <div>
          <Button
            variant="outline"
            disabled={isDefaultGlassTuning(glassTuning)}
            onClick={() => update({ glassTuning: DEFAULT_GLASS_TUNING })}
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
