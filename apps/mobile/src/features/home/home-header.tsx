import { formatGreeting, greetingForHour } from "@infinitunes/core/greeting";
import { LANGUAGES } from "@infinitunes/types";
import { languageLabel } from "@infinitunes/types";
import { router } from "expo-router";

import { ChipRow } from "~/components/chip-row";
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

/** Home's title: the greeting by time of day and first name ("Good morning, Asha"). */
export function useHomeGreeting(): string {
  const name = authClient.useSession().data?.user.name;
  return formatGreeting(salutationNow(), name);
}

/** The language chips under Home's title (the greeting). */
export function HomeHeader() {
  return <ChipRow chips={languageChips} />;
}
