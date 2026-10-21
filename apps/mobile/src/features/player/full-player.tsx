import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "~/components/empty-state";
import { LikeButton } from "~/components/like-button";
import { MenuTrigger } from "~/components/menu-trigger";
import { SongMenu } from "~/components/song-menu";
import { Artwork } from "~/components/ui/artwork";
import { IconButton } from "~/components/ui/icon-button";
import { Text } from "~/components/ui/text";
import { selectCurrentTrack, usePlayer } from "~/playback/player-store";
import { radii, sizes } from "~/theme/tokens";

import { PlayerLyrics } from "./player-lyrics";
import { RadioBadge } from "./radio-badge";
import { Scrubber } from "./scrubber";
import { TransportControls } from "./transport-controls";

/**
 * The full player, presented as a sheet over the tabs: artwork (or the
 * song's lyrics), the station badge, title, heart and menu, the scrubber and
 * transport, then Lyrics and Up next.
 */
export function FullPlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const track = usePlayer(selectCurrentTrack);
  const [showLyrics, setShowLyrics] = useState(false);

  const close = (
    <View className="items-start px-2 pt-1">
      <IconButton
        icon={{ ios: "chevron.down", android: "keyboard_arrow_down" }}
        label="Close player"
        onPress={() => router.back()}
      />
    </View>
  );

  if (!track) {
    return (
      <View className="flex-1">
        {close}
        <EmptyState
          icon={{ ios: "music.note", android: "music_note" }}
          title="Not playing"
          message="Play a song and it shows up here."
        />
      </View>
    );
  }

  const artworkSize = width - sizes.page * 2;

  return (
    <View className="flex-1">
      {close}
      {/* Scrolls, so large text and short phones never push the controls off screen. */}
      <ScrollView
        contentContainerClassName="grow justify-center gap-6 px-page"
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        {showLyrics ? (
          <PlayerLyrics track={track} size={artworkSize} />
        ) : (
          <Artwork
            image={track.image}
            quality="high"
            style={{
              width: artworkSize,
              height: artworkSize,
              borderRadius: radii.xl,
            }}
          />
        )}
        <View className="flex-row items-center gap-2">
          <View className="flex-1 gap-0.5">
            <RadioBadge />
            <Text variant="title" numberOfLines={2}>
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
            <MenuTrigger label={`More actions for ${track.name}`} size={22} />
          </SongMenu>
        </View>
        <Scrubber />
        <TransportControls />
        <View className="flex-row items-center justify-around">
          <IconButton
            icon={{ ios: "quote.bubble", android: "lyrics" }}
            label={showLyrics ? "Hide lyrics" : "Lyrics"}
            selected={showLyrics}
            onPress={() => setShowLyrics((shown) => !shown)}
          />
          <IconButton
            icon={{ ios: "list.bullet", android: "queue_music" }}
            label="Up next"
            onPress={() => router.push("/queue")}
          />
        </View>
      </ScrollView>
    </View>
  );
}
