import { FONT_IDS, HEADING_FONT_IDS, TEXT_SIZES } from "@infinitunes/types";

import { useThemeConfig } from "~/hooks/use-theme-config";
import { FONT_FACES } from "~/lib/theme/fonts";

import { OptionGroup } from "./option-group";
import { SettingsSection } from "./settings-section";

const TEXT_SIZE_LABELS = {
  15: "Small",
  16: "Default",
  17: "Large",
  18: "Larger",
} as const;

export function TypographySettings() {
  const { config, update } = useThemeConfig();

  return (
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
  );
}
