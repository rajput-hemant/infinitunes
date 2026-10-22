import { LANGUAGES, languageLabel } from "@infinitunes/types";
import type { Lang } from "@infinitunes/types";
import { ScrollView } from "react-native";

import { ListRow } from "~/components/list-row";
import { Text } from "~/components/ui/text";
import { usePreferences } from "~/lib/preferences";

/** What the catalog serves when no language is chosen (`api.ts`'s fallback). */
const DEFAULT_LANGUAGES: readonly Lang[] = ["hindi", "english"];

const label = (languages: readonly Lang[]) =>
  languages.map(languageLabel).join(", ");

/** "Hindi, English", or what an empty choice means. */
export function languagesSummary(languages: readonly Lang[]): string {
  return languages.length > 0
    ? label(languages)
    : `${label(DEFAULT_LANGUAGES)} (default)`;
}

/** The languages in effect: the choice, or the defaults without one. */
export function effectiveLanguages(
  languages: readonly Lang[],
): readonly Lang[] {
  return languages.length > 0 ? languages : DEFAULT_LANGUAGES;
}

/**
 * The effective set with `lang` flipped, in the catalog's order. The last
 * checked language stays: an empty choice means the defaults, so unchecking
 * one row would check two.
 */
export function toggled(languages: readonly Lang[], lang: Lang): Lang[] {
  const current = effectiveLanguages(languages);
  if (current.includes(lang)) {
    const rest = current.filter((selected) => selected !== lang);
    return rest.length > 0 ? rest : [...current];
  }
  return LANGUAGES.filter((known) => known === lang || current.includes(known));
}

/**
 * The languages of Home, Charts and New Releases (the web's language
 * picker), opened from Home and Settings as a sheet. Each tap applies at
 * once; with no selection the defaults show checked, and the first tap
 * starts from them.
 */
export function LanguagesScreen() {
  const languages = usePreferences((preferences) => preferences.languages);
  const setLanguages = usePreferences(
    (preferences) => preferences.setLanguages,
  );

  const checked = effectiveLanguages(languages);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <Text variant="subhead" tone="muted" className="px-page pb-2 pt-3">
        Pick the languages you want on Home, Charts and New Releases.
      </Text>
      {LANGUAGES.map((lang) => (
        <ListRow
          key={lang}
          title={languageLabel(lang)}
          checked={checked.includes(lang)}
          onPress={() => setLanguages(toggled(languages, lang))}
        />
      ))}
    </ScrollView>
  );
}
