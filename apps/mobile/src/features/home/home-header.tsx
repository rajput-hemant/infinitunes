import { formatGreeting, greetingForHour } from "@infinitunes/core/greeting";
import { LANGUAGES } from "@infinitunes/types";
import { languageLabel } from "@infinitunes/types";
import { Link, router } from "expo-router";
import { View } from "react-native";

import { ChipRow } from "~/components/chip-row";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { authClient } from "~/lib/auth-client";
import { usePending } from "~/lib/use-pending";

import { playSurprise } from "./play-home";

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

/** Greeting by time of day and first name, Surprise Me, Browse and the language chips. */
export function HomeHeader() {
  const name = authClient.useSession().data?.user.name;
  const { run, pending } = usePending();

  return (
    <View className="gap-3 pb-2">
      <View className="gap-1 px-page pt-2">
        <Text variant="title" accessibilityRole="header">
          {formatGreeting(salutationNow(), name)}
        </Text>
        <Text tone="muted">Fresh picks for you.</Text>
      </View>

      <View className="flex-row gap-3 px-page">
        <Button
          variant="secondary"
          icon={{ ios: "sparkles", android: "auto_awesome" }}
          label="Surprise Me"
          accessibilityLabel="Surprise Me - Add songs to queue and play"
          onPress={() => void run(playSurprise)}
          disabled={pending}
          className="flex-1"
        />
        <Link href="/browse" asChild>
          <Button
            variant="secondary"
            icon={{ ios: "square.grid.2x2", android: "grid_view" }}
            label="Browse"
            className="flex-1"
          />
        </Link>
      </View>

      <ChipRow chips={languageChips} />
    </View>
  );
}
