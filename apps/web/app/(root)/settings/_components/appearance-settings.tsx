"use client";

import { DENSITIES } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { Layout, Monitor, Moon, RotateCcw, Rows3, Sun } from "lucide-react";

import { useIsHydrated } from "~/hooks/use-is-hydrated";
import { useThemeConfig } from "~/hooks/use-theme-config";
import { useThemeMode } from "~/hooks/use-theme-mode";
import { controlStyles } from "~/lib/control-styles";

import { LiquidGlassSettings } from "./liquid-glass-settings";
import { OptionGroup } from "./option-group";
import { RadiusSettings } from "./radius-settings";
import { SettingsCard } from "./settings-card";
import { SettingsRow, SwitchRow } from "./settings-row";
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

/** Every appearance control as cards, with the live preview beside them on wide containers. */
export function AppearanceSettings() {
  const { config, update } = useThemeConfig();
  const { theme: storedTheme, setMode } = useThemeMode();
  // next-themes only knows the stored mode on the client; wait for hydration so
  // server and first client render agree.
  const hydrated = useIsHydrated();
  const theme = hydrated ? storedTheme : undefined;

  return (
    <div className="@container/appearance">
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 @min-[60rem]/appearance:grid-cols-[minmax(0,1fr)_18rem] @min-[60rem]/appearance:gap-6">
        <ThemePreview />

        <div className="grid min-w-0 gap-4 @min-[60rem]/appearance:col-start-1 @min-[60rem]/appearance:row-start-1">
          <SettingsCard title="Theme">
            <SettingsRow
              id="mode"
              label="Theme mode"
              help="Choose how Infinitunes looks to you."
              keywords="light dark system appearance"
            >
              <OptionGroup
                nowrap
                label="Theme mode"
                value={theme}
                onValueChange={setMode}
                className="max-sm:w-full"
                options={MODES}
              />
            </SettingsRow>

            <RadiusSettings />

            <SettingsRow
              id="density"
              label="Density"
              help="Comfortable rows with artwork, or a compact table with an album column."
              keywords="compact comfortable rows"
            >
              <OptionGroup
                nowrap
                label="Density"
                value={config.density}
                onValueChange={(density) => update({ density })}
                className="max-sm:w-full"
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
            </SettingsRow>

            <SwitchRow
              label="Reduce motion"
              help="Replace springs and slides with simple fades. Follows your system setting automatically."
              keywords="animation transitions"
              checked={config.reduceMotion}
              onCheckedChange={(reduceMotion) => update({ reduceMotion })}
            />
          </SettingsCard>

          <TypographySettings />

          <LiquidGlassSettings />
        </div>
      </div>
    </div>
  );
}

/** Restores every appearance setting, the theme mode included. */
export function ResetAppearanceButton() {
  const { reset, isDefault } = useThemeConfig();
  const { theme: storedTheme, setMode } = useThemeMode();
  const hydrated = useIsHydrated();
  const theme = hydrated ? storedTheme : undefined;

  return (
    <Button
      variant="outline"
      disabled={isDefault && theme === "system"}
      onClick={() => {
        reset();
        setMode("system");
      }}
      className={controlStyles.text}
    >
      <RotateCcw aria-hidden className="size-4" />
      Reset to defaults
    </Button>
  );
}
