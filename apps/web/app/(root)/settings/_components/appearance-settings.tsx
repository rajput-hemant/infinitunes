"use client";

import {
  DENSITIES,
  FONT_IDS,
  HEADING_FONT_IDS,
  RADIUS_MAX_REM,
  RADIUS_PRESETS,
  TEXT_SIZES,
} from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { Layout, Monitor, Moon, RotateCcw, Rows3, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { useThemeConfig } from "~/hooks/use-theme-config";
import { controlStyles } from "~/lib/control-styles";
import { FONT_FACES } from "~/lib/theme/fonts";

import { AccentPicker } from "./accent-picker";
import { radiusPatch, radiusToPx } from "./appearance-options";
import { LiquidGlassSettings } from "./liquid-glass-settings";
import { OptionGroup } from "./option-group";
import { RangeField } from "./range-field";
import { SettingsSection, SwitchRow } from "./settings-section";
import { ThemePreview } from "./theme-preview";

const MODES = [
  {
    value: "light",
    label: "Light",
    icon: <Sun aria-hidden className="size-4" />,
  },
  {
    value: "dark",
    label: "Dark",
    icon: <Moon aria-hidden className="size-4" />,
  },
  {
    value: "system",
    label: "System",
    icon: <Monitor aria-hidden className="size-4" />,
  },
] as const;

const TEXT_SIZE_LABELS = {
  15: "Small",
  16: "Default",
  17: "Large",
  18: "Larger",
} as const;

const RADIUS_MAX_PX = radiusToPx(RADIUS_MAX_REM);

const subscribeNever = () => () => {};

export function AppearanceSettings() {
  const { config, update, reset, isDefault } = useThemeConfig();
  const { theme: storedTheme, setTheme } = useTheme();
  // next-themes only knows the stored mode on the client; wait for hydration so
  // server and first client render agree.
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const theme = hydrated ? storedTheme : undefined;

  return (
    <div className="grid items-start gap-10 min-[90rem]:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="grid min-w-0 gap-10">
        <SettingsSection
          id="mode"
          title="Theme Mode"
          description="Choose how Infinitunes looks to you."
        >
          <OptionGroup
            label="Theme mode"
            value={theme}
            onValueChange={setTheme}
            options={MODES}
          />
        </SettingsSection>

        <SettingsSection
          id="accent"
          title="Accent Color"
          description="Used for buttons, active states, progress and highlights."
        >
          <AccentPicker />
        </SettingsSection>

        <SettingsSection
          id="radius"
          title="Radius"
          description="Roundness of cards, buttons and sheets."
        >
          <OptionGroup
            label="Radius preset"
            value={config.radius}
            onValueChange={(radius) => update({ radius })}
            options={RADIUS_PRESETS.map((radius) => ({
              value: radius,
              label: radius === 1 ? "1.0" : String(radius),
              style: { borderRadius: `${radius}rem` },
            }))}
          />
          <RangeField
            label="Corner radius"
            min={0}
            max={RADIUS_MAX_PX}
            step={1}
            value={radiusToPx(config.radius)}
            format={(px) => `${px}px`}
            onValueChange={(px) => update(radiusPatch(px))}
          />
        </SettingsSection>

        <SettingsSection
          id="type"
          title="Typography"
          description="Fonts for the interface and for headings, plus text size."
        >
          <div className="grid gap-4">
            <div className="space-y-2">
              <p className="text-sm/5 font-semibold">Interface font</p>
              <OptionGroup
                label="Interface font"
                value={config.font}
                onValueChange={(font) => update({ font })}
                options={FONT_IDS.map((font) => ({
                  value: font,
                  label: FONT_FACES[font].label,
                  preview: { text: "Aa", fontFamily: FONT_FACES[font].family },
                }))}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm/5 font-semibold">Heading font</p>
              <OptionGroup
                label="Heading font"
                value={config.headingFont}
                onValueChange={(headingFont) => update({ headingFont })}
                options={HEADING_FONT_IDS.map((font) => ({
                  value: font,
                  label: FONT_FACES[font].label,
                  preview: { text: "Ag", fontFamily: FONT_FACES[font].family },
                }))}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm/5 font-semibold">Text size</p>
              <p className="text-xs/4 text-muted-foreground">
                Layout and controls scale with the text.
              </p>
              <OptionGroup
                label="Text size"
                value={config.textSize}
                onValueChange={(textSize) => update({ textSize })}
                options={TEXT_SIZES.map((size) => ({
                  value: size,
                  label: TEXT_SIZE_LABELS[size],
                }))}
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          id="density"
          title="Density"
          description="Comfortable rows with artwork, or a compact table with an album column."
        >
          <OptionGroup
            label="Density"
            value={config.density}
            onValueChange={(density) => update({ density })}
            options={DENSITIES.map((density) => ({
              value: density,
              label: density === "compact" ? "Compact" : "Comfortable",
              icon:
                density === "compact" ? (
                  <Layout aria-hidden className="size-4" />
                ) : (
                  <Rows3 aria-hidden className="size-4" />
                ),
            }))}
          />
        </SettingsSection>

        <SettingsSection
          id="material"
          title="Glass and motion"
          description="Liquid Glass lets artwork glow through toolbars, the player and sheets."
        >
          <LiquidGlassSettings />
          <div className="max-w-2xl">
            <SwitchRow
              label="Reduce motion"
              help="Replace springs and slides with simple fades. Follows your system setting automatically."
              checked={config.reduceMotion}
              onCheckedChange={(reduceMotion) => update({ reduceMotion })}
            />
          </div>
        </SettingsSection>

        <div>
          <Button
            variant="outline"
            disabled={isDefault && theme === "system"}
            onClick={() => {
              reset();
              setTheme("system");
            }}
            className={controlStyles.textLg}
          >
            <RotateCcw aria-hidden className="size-4" />
            Reset to defaults
          </Button>
        </div>
      </div>

      <ThemePreview />
    </div>
  );
}
