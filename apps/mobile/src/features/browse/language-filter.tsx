import { LANGUAGES } from "@infinitunes/types";
import type { Lang } from "@infinitunes/types";
import { languageLabel } from "@infinitunes/types";
import { router } from "expo-router";
import { View } from "react-native";

import { ChipRow } from "~/components/chip-row";
import { Text } from "~/components/ui/text";

type LanguageFilterProps = {
  selected: Lang | undefined;
  /** The line under the chips, e.g. what the list shows for the language. */
  subtitle?: string;
};

/** "All" and a chip per language; picking one sets the screen's `?lang=`. */
export function LanguageFilter({ selected, subtitle }: LanguageFilterProps) {
  const chips = [
    {
      key: "all",
      label: "All",
      selected: !selected,
      onPress: () => router.setParams({ lang: undefined }),
    },
    ...LANGUAGES.map((lang) => ({
      key: lang,
      label: languageLabel(lang),
      selected: selected === lang,
      onPress: () => router.setParams({ lang }),
    })),
  ];

  return (
    <View>
      <ChipRow chips={chips} />
      {subtitle ? (
        <Text variant="subhead" tone="muted" className="px-page pb-2">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
