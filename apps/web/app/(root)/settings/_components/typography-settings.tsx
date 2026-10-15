import { FONT_IDS, HEADING_FONT_IDS, TEXT_SIZES } from "@infinitunes/types";

import { useThemeConfig } from "~/hooks/use-theme-config";
import { FONT_FACES } from "~/lib/theme/fonts";

import { OptionGroup } from "./option-group";
import { SettingsCard } from "./settings-card";
import { SettingsRow } from "./settings-row";

const TEXT_SIZE_LABELS = {
  15: "Small",
  16: "Default",
  17: "Large",
  18: "Larger",
} as const;

export function TypographySettings() {
  const { config, update } = useThemeConfig();

  return (
    <SettingsCard title="Typography">
      <SettingsRow
        id="type"
        layout="stack"
        label="Interface font"
        help="Used for body text and controls."
        keywords="typography typeface"
      >
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
      </SettingsRow>

      <SettingsRow
        layout="stack"
        label="Heading font"
        help="Used for titles and section headings."
        keywords="typography typeface"
      >
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
      </SettingsRow>

      <SettingsRow
        label="Text size"
        help="Layout and controls scale with the text."
        keywords="font zoom"
      >
        <OptionGroup
          nowrap
          label="Text size"
          value={config.textSize}
          onValueChange={(textSize) => update({ textSize })}
          className="max-sm:w-full"
          options={TEXT_SIZES.map((size) => ({
            value: size,
            label: TEXT_SIZE_LABELS[size],
          }))}
        />
      </SettingsRow>
    </SettingsCard>
  );
}
