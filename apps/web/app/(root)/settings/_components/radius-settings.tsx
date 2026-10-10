import { RADIUS_MAX_REM, RADIUS_PRESETS } from "@infinitunes/types";

import { useThemeConfig } from "~/hooks/use-theme-config";

import { radiusPatch, radiusToPx } from "./appearance-options";
import { OptionGroup } from "./option-group";
import { RangeField } from "./range-field";
import { SettingsSection } from "./settings-section";

const RADIUS_MAX_PX = radiusToPx(RADIUS_MAX_REM);

export function RadiusSettings() {
  const { config, update } = useThemeConfig();

  return (
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
  );
}
