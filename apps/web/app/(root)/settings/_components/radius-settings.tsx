import { RADIUS_MAX_REM, RADIUS_PRESETS } from "@infinitunes/types";

import { useThemeConfig } from "~/hooks/use-theme-config";

import { radiusPatch, radiusToPx } from "./appearance-options";
import { OptionGroup } from "./option-group";
import { RangeField } from "./range-field";
import { SettingsRow } from "./settings-row";

const RADIUS_MAX_PX = radiusToPx(RADIUS_MAX_REM);

/** The two radius rows of the Theme card: presets, then the pixel slider. */
export function RadiusSettings() {
  const { config, update } = useThemeConfig();

  return (
    <>
      <SettingsRow
        id="radius"
        label="Radius"
        help="Roundness of cards, buttons and sheets."
      >
        <OptionGroup
          nowrap
          label="Radius preset"
          value={config.radius}
          onValueChange={(radius) => update({ radius })}
          className="max-sm:w-full"
          options={RADIUS_PRESETS.map((radius) => ({
            value: radius,
            label: radius === 1 ? "1.0" : String(radius),
            style: { borderRadius: `${radius}rem` },
          }))}
        />
      </SettingsRow>
      <SettingsRow
        label="Corner radius"
        help="Fine-tune in pixels."
        keywords="slider px"
      >
        <RangeField
          hideLabel
          label="Corner radius"
          min={0}
          max={RADIUS_MAX_PX}
          step={1}
          value={radiusToPx(config.radius)}
          format={(px) => `${px}px`}
          onValueChange={(px) => update(radiusPatch(px))}
          className="w-full sm:w-72"
        />
      </SettingsRow>
    </>
  );
}
