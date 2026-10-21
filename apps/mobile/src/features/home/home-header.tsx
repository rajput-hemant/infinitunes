import { formatGreeting, greetingForHour } from "@infinitunes/core/greeting";
import { LANGUAGES } from "@infinitunes/types";
import { languageLabel } from "@infinitunes/types";
import { router } from "expo-router";
import { View } from "react-native";

import { ChipRow } from "~/components/chip-row";
import { Text } from "~/components/ui/text";
import { authClient } from "~/lib/auth-client";
import { hasHeaderLanguages } from "~/navigation/top-level-actions";

const CHIP_COUNT = 10;

/** The salutation for the listener's local time now. */
function salutationNow() {
  return greetingForHour(new Date().getHours());
}

/** The Languages preference, where the app bar has no room for it (`hasHeaderLanguages`). */
const languagesChip = {
  key: "languages",
  label: "Languages",
  selected: false,
  icon: { ios: "globe", android: "language" },
  onPress: () => router.push("/languages"),
} as const;

/** "For you" is this screen; each language opens that language's albums. */
const languageChips = [
  { key: "for-you", label: "For you", selected: true },
  ...LANGUAGES.slice(0, CHIP_COUNT).map((lang) => ({
    key: lang,
    label: languageLabel(lang),
    selected: false,
    onPress: () => router.push({ pathname: "/album", params: { lang } }),
  })),
];

/** The greeting by time of day and first name, then the language chips. */
export function HomeHeader() {
  const name = authClient.useSession().data?.user.name;

  return (
    <View>
      <Text variant="subhead" tone="muted" className="px-page">
        {formatGreeting(salutationNow(), name)}
      </Text>
      <ChipRow
        chips={
          hasHeaderLanguages()
            ? languageChips
            : [languagesChip, ...languageChips]
        }
      />
    </View>
  );
}
