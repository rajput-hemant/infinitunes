"use client";

import { DENSITIES } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { Layout, Monitor, Moon, RotateCcw, Rows3, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { useThemeConfig } from "~/hooks/use-theme-config";
import { controlStyles } from "~/lib/control-styles";

import { AccentPicker } from "./accent-picker";
import { LiquidGlassSettings } from "./liquid-glass-settings";
import { OptionGroup } from "./option-group";
import { RadiusSettings } from "./radius-settings";
import { SwitchRow } from "./settings-row";
import { SettingsSection } from "./settings-section";
import { ThemePreview } from "./theme-preview";
import { TypographySettings } from "./typography-settings";

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

        <RadiusSettings />

        <TypographySettings />

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
