import { getImageSrc } from "@infinitunes/types";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "~/components/empty-state";
import { LikeButton } from "~/components/like-button";
import { SongMenu } from "~/components/song-menu";
import { Icon } from "~/components/ui/icon";
import { IconButton } from "~/components/ui/icon-button";
import { Text } from "~/components/ui/text";
import { selectCurrentTrack, usePlayer } from "~/playback/player-store";
import { radii, sizes } from "~/theme/tokens";

import { Scrubber } from "./scrubber";
import { TransportControls } from "./transport-controls";

/** The full player, presented as a sheet over the tabs. */
export function FullPlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const track = usePlayer(selectCurrentTrack);

  if (!track) {
    return (
      <EmptyState
        icon={{ ios: "music.note", android: "music_note" }}
        title="Not playing"
        message="Play a song and it shows up here."
      />
    );
  }

  const artworkSize = width - sizes.page * 2;

  return (
    <View
      className="flex-1 justify-center gap-6 px-page"
      style={{ paddingBottom: insets.bottom }}
    >
      <Image
        source={getImageSrc(track.image, "high")}
        style={{
          width: artworkSize,
          height: artworkSize,
          borderRadius: radii.xl,
        }}
        transition={200}
        accessibilityIgnoresInvertColors
      />
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <Text variant="title" numberOfLines={1}>
            {track.name}
          </Text>
          <Text tone="muted" numberOfLines={1}>
            {track.subtitle}
          </Text>
        </View>
        {track.type === "song" ? (
          <LikeButton type="song" token={track.id} name={track.name} />
        ) : null}
        <SongMenu song={track}>
          <View
            accessibilityRole="button"
            accessibilityLabel={`More actions for ${track.name}`}
            className="size-ctl items-center justify-center"
          >
            <Icon name={{ ios: "ellipsis", android: "more_vert" }} />
          </View>
        </SongMenu>
      </View>
      <Scrubber />
      <TransportControls />
      <View className="items-center">
        <IconButton
          icon={{ ios: "list.bullet", android: "queue_music" }}
          label="Up next"
          onPress={() => router.push("/queue")}
        />
      </View>
    </View>
  );
}
