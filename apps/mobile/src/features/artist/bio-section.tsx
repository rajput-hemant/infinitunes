import type { ArtistBioSection } from "@infinitunes/types";
import { View } from "react-native";

import { Text } from "~/components/ui/text";

/** One biography section as plain native text (the payload's markup is already reduced to text). */
export function BioSection({ section }: { section: ArtistBioSection }) {
  return (
    <View className="gap-2 px-page py-3">
      {section.title ? (
        <Text variant="headline" accessibilityRole="header">
          {section.title}
        </Text>
      ) : null}
      {section.paragraphs.map((paragraph, index) => (
        <Text key={index} tone="muted" selectable>
          {paragraph}
        </Text>
      ))}
      {section.bullets?.map((bullet, index) => (
        <Text key={index} tone="muted" selectable>
          {`•  ${bullet}`}
        </Text>
      ))}
    </View>
  );
}
