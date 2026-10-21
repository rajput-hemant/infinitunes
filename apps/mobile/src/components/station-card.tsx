import type { CardItem } from "@infinitunes/types";
import { useTheme } from "expo-router";
import { View } from "react-native";

import { usePending } from "~/lib/use-pending";
import { stationRef } from "~/navigation/station-ref";
import { playStation } from "~/playback/radio";
import { sizes } from "~/theme/tokens";

import { MEDIA_CARD_WIDTH, MediaCard } from "./media-card";
import { IconButton } from "./ui/icon-button";

/** Distance of the play button from the artwork's bottom-right corner. */
const PLAY_INSET = 4;

type StationCardProps = {
  item: CardItem;
  width?: number;
};

/**
 * A radio station's card (it opens the station's screen) with a play button
 * over the artwork that tunes in at once. The button is a sibling of the
 * card, not inside it, so screen readers can reach both.
 */
export function StationCard({
  item,
  width = MEDIA_CARD_WIDTH,
}: StationCardProps) {
  const { colors } = useTheme();
  const station = stationRef(item.url);
  const { run, pending } = usePending();

  return (
    <View style={{ width }}>
      <MediaCard item={item} width={width} />
      {station ? (
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
            onPress={() => void run(() => playStation(station))}
            disabled={pending}
            size={18}
            color={colors.background}
          />
        </View>
      ) : null}
    </View>
  );
}
