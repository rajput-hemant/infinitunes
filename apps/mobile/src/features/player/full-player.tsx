import { getImageSrc } from "@infinitunes/types";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentRef } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "~/components/empty-state";
import { ExplicitBadge } from "~/components/explicit-badge";
import { LikeButton } from "~/components/like-button";
import { MenuTrigger } from "~/components/menu-trigger";
import { SongMenu } from "~/components/song-menu";
import { Artwork, artworkFrame } from "~/components/ui/artwork";
import { IconButton } from "~/components/ui/icon-button";
import { usePreferences } from "~/lib/preferences";
import { usePlaybackStatus } from "~/playback/playback-status";
import { selectCurrentTrack, usePlayer } from "~/playback/player-store";
import { springs } from "~/theme/motion";
import { playerArtSize } from "~/theme/tokens";
import type { TextVariant } from "~/theme/tokens";
import { usePalette, useTokenColor } from "~/theme/use-palette";
import { useRadii } from "~/theme/use-radii";

import { PlayerLyrics } from "./player-lyrics";
import { Scrubber } from "./scrubber";
import { ModeToggle, TransportControls } from "./transport-controls";
import { usePlayerColors } from "./use-player-colors";
import {
  Backdrop,
  CROSSFADE_MS,
  gradientFill,
  nowPlayingWash,
  OnWash,
  useWashColors,
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

/** One `rrggbb` channel (0, 2 or 4) as a number. */
function channel(value: string, index: number) {
  return Number.parseInt(value.slice(index, index + 2), 16);
}

/**
 * The vertical gradient's colour at `t` (0 top, 1 bottom): a linear sRGB
 * mix, as CSS gradients interpolate. Non-hex stops come back unmixed.
 */
function mixHex([top, bottom]: readonly [string, string], t: number) {
  const hex = /^#([\da-f]{6})$/i;
  const a = hex.exec(top)?.[1];
  const b = hex.exec(bottom)?.[1];
  if (!a || !b) return t < 0.5 ? top : bottom;
  const at = Math.min(1, Math.max(0, t));
  return `#${[0, 2, 4]
    .map((index) =>
      Math.round(
        channel(a, index) + (channel(b, index) - channel(a, index)) * at,
      )
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** The track title: Material's headlineSmall on Android, iOS's title 2. */
const TITLE_VARIANT = Platform.select<TextVariant>({
  android: "title1",
  default: "title2",
});

/**
 * Settles the art: Material 3 Expressive's slow spatial spring (a large
 * surface) on Android, the system players' ease on iOS.
 */
function settle(target: number) {
  return Platform.OS === "android"
    ? withSpring(target, springs.spatialSlow)
    : withTiming(target, { duration: 340 });
}

/**
 * The artwork, a little smaller while paused (the system players' cue).
 * That is movement, so reduce motion keeps it at full size. A new track's
 * cover crossfades over the old one with the wash (expo-image's transition;
 * `Artwork` would drop the old picture first), at the Image quality cap.
 */
function NowPlayingArt({ image }: { image: string }) {
  const corner = useRadii();
  const { width } = useWindowDimensions();
  const cap = usePreferences((preferences) => preferences.imageQuality);
  const playing = usePlaybackStatus((state) => state.playing);
  const reduceMotion = useReducedMotion();
  const target = playing || reduceMotion ? 1 : PAUSED_SCALE;
  // Opened while paused, the art starts settled instead of shrinking in.
  const scale = useSharedValue(target);
  useEffect(() => {
    scale.set(settle(target));
  }, [target, scale]);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));
  const frame = {
    ...artworkFrame("player", width, false, corner),
    borderRadius: corner[ART_CORNER],
  };

  return (
    <Animated.View
      style={[{ borderRadius: corner[ART_CORNER] }, ART_SHADOW, animated]}
    >
      {image ? (
        <Image
          // The player's art is always past the 150px picture: the cap decides.
          source={getImageSrc(image, cap)}
          style={frame}
          transition={{ duration: CROSSFADE_MS, effect: "cross-dissolve" }}
          testID="now-playing-art"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Artwork
          image={image}
          size="player"
          testID="now-playing-art"
          style={{ borderRadius: corner[ART_CORNER] }}
        />
      )}
    </Animated.View>
  );
}

/**
 * The "E" before the credit. On a wash the badge's `muted` fill could not
 * be contrast-checked, so it is a hairline outline in the wash's muted colour.
 */
function ExplicitMark() {
  const wash = useWashColors();
  if (!wash) return <ExplicitBadge accessible={false} />;
  return (
    <View
      className="rounded-xs px-1"
      style={{ borderWidth: StyleSheet.hairlineWidth, borderColor: wash.muted }}
    >
      <WashText variant="caption" tone="muted">
        E
      </WashText>
    </View>
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
  const paletteBackground = usePalette().background;
  const [showLyrics, setShowLyrics] = useState(false);
  // Where the art / lyrics slot spans down the backdrop (0 top, 1 bottom).
  const root = useRef<ComponentRef<typeof View>>(null);
  const slot = useRef<ComponentRef<typeof View>>(null);
  const [span, setSpan] = useState<readonly [number, number] | null>(null);
  const measureSlot = () =>
    root.current?.measureInWindow((_x, rootY, _width, rootHeight) =>
      slot.current?.measureInWindow((_slotX, y, _slotWidth, height) => {
        if (rootHeight > 0)
          setSpan([
            (y - rootY) / rootHeight,
            (y + height - rootY) / rootHeight,
          ]);
      }),
    );

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
  // The lyrics fade into the fill: the wash's stops, or Android's D1
  // background (iOS's is a dynamic system colour with no hex to fade).
  // The wash's colour at the lyrics' own top and bottom, not the screen's.
  const lyricEdges = colors
    ? span
      ? ([mixHex(colors.wash, span[0]), mixHex(colors.wash, span[1])] as const)
      : colors.wash
    : Platform.OS === "android"
      ? ([paletteBackground, paletteBackground] as const)
      : null;

  return (
    <View ref={root} className="flex-1">
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
          contentContainerClassName="grow px-6 py-4"
          contentContainerStyle={{ paddingBottom: insets.bottom }}
        >
          {/* Centred in the space above the pinned Lyrics / Up next row. */}
          <View className="grow justify-center">
            <View ref={slot} onLayout={measureSlot} className="items-center">
              {showLyrics ? (
                <PlayerLyrics
                  track={track}
                  size={artworkSize}
                  edges={lyricEdges}
                />
              ) : (
                <NowPlayingArt image={track.image} />
              )}
            </View>
            <View className="mt-8 flex-row items-center gap-2">
              <View className="flex-1">
                <WashText variant={TITLE_VARIANT} emphasized numberOfLines={1}>
                  {track.name}
                </WashText>
                <View
                  accessible={track.explicit}
                  accessibilityLabel={
                    track.explicit ? `Explicit, ${track.subtitle}` : undefined
                  }
                  className="flex-row items-center gap-1"
                >
                  {track.explicit ? <ExplicitMark /> : null}
                  <WashText tone="muted" numberOfLines={1} className="shrink">
                    {track.subtitle}
                  </WashText>
                </View>
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
          </View>
          <View className="flex-row items-center justify-between pt-8">
            <ModeToggle
              icon={{ ios: "quote.bubble", android: "lyrics" }}
              label="Lyrics"
              on={showLyrics}
              onPress={() => setShowLyrics((shown) => !shown)}
            />
            <IconButton
              icon={{ ios: "list.bullet", android: "queue_music" }}
              label="Up next"
              size="md"
              onPress={() => router.push("/queue")}
            />
          </View>
        </ScrollView>
      </OnWash>
    </View>
  );
}
