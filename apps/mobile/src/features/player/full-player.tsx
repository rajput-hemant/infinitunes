import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, useWindowDimensions, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "~/components/empty-state";
import { LikeButton } from "~/components/like-button";
import { MenuTrigger } from "~/components/menu-trigger";
import { SongMenu } from "~/components/song-menu";
import { Artwork } from "~/components/ui/artwork";
import { IconButton } from "~/components/ui/icon-button";
import { usePlaybackStatus } from "~/playback/playback-status";
import { selectCurrentTrack, usePlayer } from "~/playback/player-store";
import { playerArtSize } from "~/theme/tokens";
import { useTokenColor } from "~/theme/use-palette";
import { useRadii } from "~/theme/use-radii";

import { PlayerLyrics } from "./player-lyrics";
import { Scrubber } from "./scrubber";
import { TransportControls } from "./transport-controls";
import { usePlayerColors } from "./use-player-colors";
import {
  Backdrop,
  gradientFill,
  nowPlayingWash,
  OnWash,
  WashText,
} from "./wash";

/** iOS lifts the artwork off the wash (spec 2.9); Material is flat. */
const ART_SHADOW = Platform.select({
  ios: { boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)" },
  default: undefined,
});

/** Material 3 Expressive gives the hero artwork the extra-large shape (28dp). */
const ART_CORNER = Platform.OS === "android" ? "xl" : "lg";

/** How far the artwork settles back while paused. */
const PAUSED_SCALE = 0.9;

/**
 * The artwork, a little smaller while paused (the system players' cue).
 * That is movement, so reduce motion keeps it at full size.
 */
function NowPlayingArt({ image }: { image: string }) {
  const corner = useRadii();
  const playing = usePlaybackStatus((state) => state.playing);
  const reduceMotion = useReducedMotion();
  const target = playing || reduceMotion ? 1 : PAUSED_SCALE;
  // Opened while paused, the art starts settled instead of shrinking in.
  const scale = useSharedValue(target);
  useEffect(() => {
    scale.set(withTiming(target, { duration: 340 }));
  }, [target, scale]);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Animated.View
      style={[{ borderRadius: corner[ART_CORNER] }, ART_SHADOW, animated]}
    >
      <Artwork
        image={image}
        size="player"
        testID="now-playing-art"
        style={{ borderRadius: corner[ART_CORNER] }}
      />
    </Animated.View>
  );
}

/** Where the queue comes from: today only a radio station names itself. */
function PlayingFrom() {
  const station = usePlayer((state) => state.radio?.name);
  if (!station) return <View className="flex-1" />;
  return (
    <View
      accessible
      accessibilityLabel={`Playing ${station}`}
      className="flex-1 items-center"
    >
      <WashText variant="caption" tone="muted" numberOfLines={1}>
        Playing from
      </WashText>
      <WashText variant="footnote" numberOfLines={1}>
        {station}
      </WashText>
    </View>
  );
}

/**
 * Now Playing, presented as a sheet over the tabs (spec 2.10, D3 Ambient
 * Tonal): the current artwork's wash behind a top bar (close, where the queue
 * plays from, the song menu), the artwork or its lyrics, title and heart,
 * scrubber, transport, then Lyrics and Up next. Text and controls take the
 * wash's contrast-checked colours; without them (loading the first cover,
 * extraction failed, a contrast miss) the screen is the D1 palette.
 */
export function FullPlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Android shows the player edge to edge, under the status bar; iOS's sheet starts below it.
  const top = { paddingTop: Platform.OS === "android" ? insets.top : 0 };
  const { width } = useWindowDimensions();
  const track = usePlayer(selectCurrentTrack);
  const colors = usePlayerColors(track?.image);
  // One object per palette, so `OnWash`'s theme stays put between renders.
  const wash = useMemo(
    () => (colors ? nowPlayingWash(colors) : null),
    [colors],
  );
  const background = useTokenColor("background");
  const [showLyrics, setShowLyrics] = useState(false);

  const fill = colors
    ? gradientFill(colors.wash)
    : { key: "background", style: { backgroundColor: background } };

  const close = (
    <IconButton
      icon={{ ios: "chevron.down", android: "keyboard_arrow_down" }}
      label="Close player"
      onPress={() => router.back()}
    />
  );

  if (!track) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-row px-3 pt-2" style={top}>
          {close}
        </View>
        <EmptyState
          icon={{ ios: "music.note", android: "music_note" }}
          title="Not playing"
          message="Play a song and it shows up here."
        />
      </View>
    );
  }

  const artworkSize = playerArtSize(width);

  return (
    <View className="flex-1">
      <Backdrop fill={fill} />
      <OnWash colors={wash}>
        <View className="flex-row items-center px-3 pt-2" style={top}>
          {close}
          <PlayingFrom />
          <SongMenu song={track}>
            <MenuTrigger label={`More actions for ${track.name}`} size="lg" />
          </SongMenu>
        </View>
        {/* Scrolls, so large text and short phones never push the controls off screen. */}
        <ScrollView
          contentContainerClassName="grow justify-center px-6 py-4"
          contentContainerStyle={{ paddingBottom: insets.bottom }}
        >
          <View className="items-center">
            {showLyrics ? (
              <PlayerLyrics track={track} size={artworkSize} />
            ) : (
              <NowPlayingArt image={track.image} />
            )}
          </View>
          <View className="mt-8 flex-row items-center gap-2">
            <View className="flex-1">
              <WashText variant="title2" emphasized numberOfLines={1}>
                {track.name}
              </WashText>
              <WashText tone="muted" numberOfLines={1}>
                {track.subtitle}
              </WashText>
            </View>
            {track.type === "song" ? (
              <LikeButton type="song" token={track.id} name={track.name} />
            ) : null}
          </View>
          <View className="mt-6">
            <Scrubber />
          </View>
          <View className="mt-6">
            <TransportControls />
          </View>
          <View className="mt-8 flex-row items-center justify-between">
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
      </OnWash>
    </View>
  );
}
