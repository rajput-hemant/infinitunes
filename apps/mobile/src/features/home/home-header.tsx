import { formatGreeting, greetingForHour } from "@infinitunes/core/greeting";
import { LANGUAGES } from "@infinitunes/types";
import { languageLabel } from "@infinitunes/types";
import { router } from "expo-router";
import { View } from "react-native";

import { ChipRow } from "~/components/chip-row";
import { Text } from "~/components/ui/text";
import { authClient } from "~/lib/auth-client";

const CHIP_COUNT = 10;

/** The salutation for the listener's local time now. */
function salutationNow() {
  return greetingForHour(new Date().getHours());
}

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
      <ChipRow chips={languageChips} />
    </View>
  );
}
