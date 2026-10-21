import type { CardItem } from "@infinitunes/types";
import { getImageSrc } from "@infinitunes/types";
import { Image } from "expo-image";
import { Link, useTheme } from "expo-router";
import { Pressable, View } from "react-native";

import { MEDIA_CARD_WIDTH } from "~/components/media-card";
import { IconButton } from "~/components/ui/icon-button";
import { Text } from "~/components/ui/text";
import { usePendingAction } from "~/features/browse/use-pending-action";
import { sizes } from "~/theme/tokens";

import { playStation } from "./play-radio";
import { stationHref, stationRef } from "./station-ref";

/** Distance of the play button from the artwork's bottom-right corner. */
const PLAY_INSET = 4;

type StationCardProps = {
  item: CardItem;
  width?: number;
};

/**
 * A radio station: round artwork and name that open the station's screen, with
 * a play button over the artwork that tunes in at once. The button is a
 * sibling of the card, not inside it, so screen readers can reach both.
 */
export function StationCard({
  item,
  width = MEDIA_CARD_WIDTH,
}: StationCardProps) {
  const { colors } = useTheme();
  const ref = stationRef(item.url);
  const href = ref && stationHref(ref);
  const { run: play, pending } = usePendingAction(async () => {
    if (ref) await playStation(ref);
  });

  const card = (
    <Pressable
      disabled={!href}
      accessibilityRole={href ? "link" : undefined}
      accessibilityLabel={
        item.subtitle ? `${item.name}, ${item.subtitle}` : item.name
      }
      className="items-center gap-1.5 active:opacity-70"
      style={{ width }}
    >
      <Image
        source={getImageSrc(item.image, "high")}
        style={{ width, height: width, borderRadius: width / 2 }}
        transition={150}
        accessibilityIgnoresInvertColors
      />
      <Text variant="subhead" numberOfLines={1}>
        {item.name}
      </Text>
      {item.subtitle ? (
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {item.subtitle}
        </Text>
      ) : null}
    </Pressable>
  );

  return (
    <View style={{ width }}>
      {href ? (
        <Link href={href} asChild>
          {card}
        </Link>
      ) : (
        card
      )}
      {ref ? (
        <View
          className="absolute rounded-full bg-primary"
          style={{
            top: width - sizes.ctl - PLAY_INSET,
            left: width - sizes.ctl - PLAY_INSET,
          }}
        >
          <IconButton
            icon={{ ios: "play.fill", android: "play_arrow" }}
            label={`Play ${item.name}`}
            onPress={() => void play()}
            disabled={pending}
            size={18}
            color={colors.background}
          />
        </View>
      ) : null}
    </View>
  );
}
