"use client";

import { GLASS_LEVELS } from "@infinitunes/types";
import type { GlassLevel, GlassTuning } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { ChevronDown, Layers, RotateCcw } from "lucide-react";
import { useId, useState } from "react";

import { useThemeConfig } from "~/hooks/use-theme-config";
import { controlStyles } from "~/lib/control-styles";
import {
  GLASS_PRESETS,
  GLASS_PRESET_IDS,
  matchingPreset,
} from "~/lib/glass/tuning";
import type { GlassPresetId } from "~/lib/glass/tuning";
import { DEFAULT_GLASS_TUNING } from "~/lib/theme-config";
import { cn } from "~/lib/utils";

import {
  GLASS_SLIDERS,
  formatSliderValue,
  isDefaultGlassTuning,
  sliderPatch,
  sliderValue,
} from "./glass-tuning";
import { OptionGroup } from "./option-group";
import { RangeField } from "./range-field";
import { SettingsCard, SettingsCardFooter } from "./settings-card";
import { matchesQuery } from "./settings-match";
import { SettingsRow } from "./settings-row";
import { useSettingsQuery } from "./settings-search";

const LEVEL_LABELS: Record<GlassLevel, string> = {
  liquid: "Liquid glass",
  subtle: "Subtle",
  solid: "Solid",
};

const QUICK_KEYS = new Set(["tint", "blur"]);
const quickSliders = GLASS_SLIDERS.filter(({ key }) => QUICK_KEYS.has(key));
const lensSliders = GLASS_SLIDERS.filter(({ key }) => !QUICK_KEYS.has(key));
const LENS_SUMMARY = lensSliders.map(({ label }) => label).join(", ");

/** Glass level, presets and the lens controls, all stored in the theme config. */
export function LiquidGlassSettings() {
  const { config, update } = useThemeConfig();
  const { glass, glassTuning } = config;
  const tintColorId = useId();
  const isSolid = glass === "solid";
  const preset = matchingPreset(glassTuning);

  function tune(patch: Partial<GlassTuning>) {
    update({ glassTuning: { ...glassTuning, ...patch } });
  }

  return (
    <SettingsCard title="Glass">
      <SettingsRow
        id="material"
        label="Glass level"
        help="Liquid Glass lets artwork glow through toolbars, the player and sheets."
        keywords="material liquid subtle solid"
      >
        <OptionGroup
          nowrap
          label="Glass level"
          value={glass}
          onValueChange={(next) => update({ glass: next })}
          className="max-sm:w-full"
          options={GLASS_LEVELS.map((level) => ({
            value: level,
            label: LEVEL_LABELS[level],
            icon:
              level === "liquid" ? (
                <Layers aria-hidden className="size-4" />
              ) : undefined,
          }))}
        />
      </SettingsRow>

      <fieldset
        disabled={isSolid}
        className="m-0 min-w-0 border-0 p-0 disabled:opacity-50"
      >
        <legend className="sr-only">Liquid Glass tuning</legend>

        <SettingsRow
          layout="stack"
          label="Preset"
          help="Start from a look, then tune it."
          keywords="glass presets simple thick frosted cut plexiglass"
        >
          <OptionGroup<GlassPresetId>
            label="Glass preset"
            value={preset ?? undefined}
            onValueChange={(id) =>
              update({ glassTuning: { ...GLASS_PRESETS[id].tuning } })
            }
            options={GLASS_PRESET_IDS.map((id) => ({
              value: id,
              label: GLASS_PRESETS[id].label,
            }))}
          />
        </SettingsRow>

        {quickSliders.map((slider) => (
          <SettingsRow
            key={slider.key}
            label={slider.label}
            help={slider.help}
            keywords={`glass ${slider.key === "tint" ? "color colour accent" : "frost"}`}
          >
            <div className="flex w-full items-center gap-3 sm:w-72">
              <RangeField
                hideLabel
                label={slider.label}
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={sliderValue(slider, glassTuning)}
                format={(shown) => formatSliderValue(slider, shown)}
                onValueChange={(shown) => tune(sliderPatch(slider, shown))}
                className="min-w-0 flex-1"
              />
              {slider.key === "tint" && (
                <>
                  <label htmlFor={tintColorId} className="sr-only">
                    Tint color
                  </label>
                  <input
                    id={tintColorId}
                    type="color"
                    value={glassTuning.tintColor}
                    onChange={(event) =>
                      tune({ tintColor: event.currentTarget.value })
                    }
                    className="h-(--ctl) w-12 shrink-0 cursor-pointer rounded-sm border border-line bg-transparent p-0.5"
                  />
                </>
              )}
            </div>
          </SettingsRow>
        ))}

        <LensFineTune />
      </fieldset>

      <SettingsCardFooter className="group-data-searching/settings:hidden">
        <span>
          {preset
            ? `Matches the "${GLASS_PRESETS[preset].label}" preset.`
            : "Custom tuning. Pick a preset to start over."}
        </span>
        <Button
          variant="outline"
          disabled={isDefaultGlassTuning(glassTuning)}
          onClick={() => update({ glassTuning: DEFAULT_GLASS_TUNING })}
          className={controlStyles.text}
        >
          <RotateCcw aria-hidden className="size-4" />
          Reset glass
        </Button>
      </SettingsCardFooter>
    </SettingsCard>
  );
}

const LENS_KEYWORDS = `fine-tune lens ${lensSliders
  .map(({ label, key }) => `${label} ${key}`)
  .join(" ")}`;

/** The rim controls. Collapsed at first; a search that matches one of them opens it. */
function LensFineTune() {
  const { config, update } = useThemeConfig();
  const { glassTuning } = config;
  const query = useSettingsQuery();
  const [userOpen, setUserOpen] = useState(false);
  const panelId = useId();
  const searchOpens = query.trim() !== "" && matchesQuery(LENS_KEYWORDS, query);
  const open = userOpen || searchOpens;

  return (
    <>
      <SettingsRow
        label="Fine-tune the lens"
        help={LENS_SUMMARY}
        keywords={LENS_KEYWORDS}
        className="relative"
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label="Fine-tune the lens"
          onClick={() => setUserOpen(!open)}
          className="absolute inset-0 flex items-center justify-end rounded-[inherit] px-4 text-muted-foreground transition-colors duration-fast hover:bg-fill focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 transition-transform duration-fast",
              open && "rotate-180",
            )}
          />
        </button>
      </SettingsRow>

      {open && (
        <div id={panelId}>
          {lensSliders.map((slider) => (
            <SettingsRow
              key={slider.key}
              label={slider.label}
              help={slider.help}
              keywords={`lens ${slider.key}`}
            >
              <RangeField
                hideLabel
                label={slider.label}
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={sliderValue(slider, glassTuning)}
                format={(shown) => formatSliderValue(slider, shown)}
                onValueChange={(shown) =>
                  update({
                    glassTuning: {
                      ...glassTuning,
                      ...sliderPatch(slider, shown),
                    },
                  })
                }
                className="w-full sm:w-72"
              />
            </SettingsRow>
          ))}
        </div>
      )}
    </>
  );
}
