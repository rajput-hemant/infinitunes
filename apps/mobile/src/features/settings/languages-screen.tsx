import { LANGUAGES, languageLabel } from "@infinitunes/types";
import type { Lang } from "@infinitunes/types";
import { ScrollView } from "react-native";

import { ListRow } from "~/components/list-row";
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
  const languages = usePreferences((preferences) => preferences.languages);
  const setLanguages = usePreferences(
    (preferences) => preferences.setLanguages,
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <Text tone="muted" className="px-page pb-2 pt-3">
        Pick the languages you want on Home, Charts and New Releases.
      </Text>
      {LANGUAGES.map((lang) => (
        <ListRow
          key={lang}
          title={languageLabel(lang)}
          checked={languages.includes(lang)}
          onPress={() => setLanguages(toggled(languages, lang))}
        />
      ))}
    </ScrollView>
  );
}
