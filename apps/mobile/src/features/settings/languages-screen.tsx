import { LANGUAGES, languageLabel } from "@infinitunes/types";
import type { Lang } from "@infinitunes/types";
import { useTheme } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { usePreferences } from "~/lib/preferences";

/** "Hindi, English", or what an empty choice means. */
export function languagesSummary(languages: readonly Lang[]): string {
  return languages.length > 0
    ? languages.map(languageLabel).join(", ")
    : "Hindi, English (default)";
}

function toggled(languages: readonly Lang[], lang: Lang): Lang[] {
  return languages.includes(lang)
    ? languages.filter((selected) => selected !== lang)
    : LANGUAGES.filter((known) => known === lang || languages.includes(known));
}

/**
 * The languages of Home, Charts and New Releases (the web's language
 * picker), opened from Home and Settings as a sheet. Each tap applies at
 * once; no selection is the catalog's default.
 */
export function LanguagesScreen() {
  const { colors } = useTheme();
  const languages = usePreferences((preferences) => preferences.languages);
  const setLanguages = usePreferences(
    (preferences) => preferences.setLanguages,
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <Text tone="muted" className="px-page pb-2 pt-3">
        Pick the languages you want on Home, Charts and New Releases.
      </Text>
      {LANGUAGES.map((lang) => {
        const selected = languages.includes(lang);
        return (
          <Pressable
            key={lang}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            onPress={() => setLanguages(toggled(languages, lang))}
            className="min-h-row flex-row items-center justify-between px-page py-1 active:opacity-70"
          >
            <Text>{languageLabel(lang)}</Text>
            {selected ? (
              <Icon
                name={{ ios: "checkmark", android: "check" }}
                size={18}
                color={colors.primary}
              />
            ) : (
              <View />
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
