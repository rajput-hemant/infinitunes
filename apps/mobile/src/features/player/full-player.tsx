import type { Queue } from "@infinitunes/types";
import { getImageSrc } from "@infinitunes/types";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentRef } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import type { LayoutChangeEvent, LayoutRectangle } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "~/components/empty-state";
import { ExplicitBadge } from "~/components/explicit-badge";
import { LikeButton } from "~/components/like-button";
import { MenuTrigger } from "~/components/menu-trigger";
import { SongMenu } from "~/components/song-menu";
import { Artwork, artworkFrame } from "~/components/ui/artwork";
import { Icon } from "~/components/ui/icon";
import type { SymbolName } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { usePreferences } from "~/lib/preferences";
import { usePlaybackStatus } from "~/playback/playback-status";
import {
  playerStore,
  selectCurrentTrack,
  usePlayer,
} from "~/playback/player-store";
import { springs } from "~/theme/motion";
import { art, playerArtSize, space } from "~/theme/tokens";
import type { TextVariant } from "~/theme/tokens";
import { usePalette, useTokenColor } from "~/theme/use-palette";
import { useRadii } from "~/theme/use-radii";

import { songSwipeActions, useDismissPan, useSwipeable } from "./gestures";
import { PlayerLyrics } from "./player-lyrics";
import { QueueList } from "./queue-list";
import { Scrubber } from "./scrubber";
import {
  ModeToggle,
  REPEAT_ICONS,
  REPEAT_LABELS,
  shuffleIcon,
  TransportControls,
} from "./transport-controls";
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

/** The compact header's artwork edge (queue and lyrics). */
const COMPACT_ART = art.tile;

/** What fills the space above the scrubber: the artwork, its lyrics, or the queue. */
export type PlayerView = "art" | "lyrics" | "queue";

/** The `view` route param (`/player?view=queue`) as a view; anything else is the artwork. */
export function playerViewOf(param: unknown): PlayerView {
  return param === "queue" || param === "lyrics" ? param : "art";
}

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
 * The cover at the hero size, edge to edge in its rounded clip. A new
 * track's cover crossfades over the old one with the wash (expo-image's
 * transition; `Artwork` would drop the old picture first), at the Image
 * quality cap.
 */
function NowPlayingArt({ image }: { image: string }) {
  const { width } = useWindowDimensions();
  const cap = usePreferences((preferences) => preferences.imageQuality);
  const frame = { ...artworkFrame("player", width, false), borderRadius: 0 };

  return (
    <View>
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
          style={{ borderRadius: 0 }}
        />
      )}
    </View>
  );
}

/**
 * The whole artwork (clip and shadow) a little smaller while paused, the
 * system players' cue. Scaling the picture inside its clip instead left a
 * square image floating in an empty rounded frame. That is movement, so
 * reduce motion keeps it at full size, as does the compact header.
 */
function usePausedScale(compact: boolean) {
  const playing = usePlaybackStatus((state) => state.playing);
  const reduceMotion = useReducedMotion();
  const target = playing || reduceMotion || compact ? 1 : PAUSED_SCALE;
  // Opened while paused, the art starts settled instead of shrinking in.
  const scale = useSharedValue(target);
  useEffect(() => {
    scale.set(settle(target));
  }, [target, scale]);
  return scale;
}

type Slots = {
  /** The artwork view's box in the top area, while it shows. */
  stage: SharedValue<LayoutRectangle | null>;
  /** The compact header row in the top area, while it shows. */
  header: SharedValue<LayoutRectangle | null>;
};

type Swipeable = ReturnType<typeof useSwipeable>;

/**
 * One artwork for every view, so it can fly between them: centred in the
 * stage (as large as fits, up to the hero size) or at the compact header's
 * start. It is laid out at the hero size and moved and scaled on the UI
 * thread by `progress` (0 the stage, 1 the header); its corners scale back
 * so the small one keeps a row's radius. It stays hidden until the slot it
 * sits in has been measured.
 */
function HeroArt({
  track,
  progress,
  fade,
  slots,
  compact,
  swipe,
  swipeX,
}: {
  track: Queue;
  progress: SharedValue<number>;
  fade: SharedValue<number>;
  slots: Slots;
  compact: boolean;
  swipe: Swipeable;
  /** The song swipe's offset, applied unscaled so the small art follows the finger too. */
  swipeX: SharedValue<number>;
}) {
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const corner = useRadii();
  const hero = playerArtSize(width);
  const big = corner[ART_CORNER];
  const small = (corner.sm * hero) / COMPACT_ART;
  const { stage, header } = slots;
  const paused = usePausedScale(compact);
  const place = useAnimatedStyle(() => {
    const p = progress.get();
    const box = stage.get();
    const row = header.get();
    const edge = box ? Math.min(hero, box.height) : hero;
    const large = box && {
      x: box.x + (box.width - edge) / 2,
      y: box.y + (box.height - edge) / 2,
      edge,
    };
    const compactSlot = row && {
      x: row.x + space.xl,
      y: row.y + (row.height - COMPACT_ART) / 2,
      edge: COMPACT_ART,
    };
    // A slot not measured yet (its view mounts this frame) stands in with the
    // other one, so the art holds where it is for that frame instead of vanishing.
    const from = large ?? compactSlot;
    const to = compactSlot ?? large;
    const ready = from !== null && to !== null;
    const size = ready ? from.edge + (to.edge - from.edge) * p : hero;
    const x = ready ? from.x + (to.x - from.x) * p : 0;
    const y = ready ? from.y + (to.y - from.y) * p : 0;
    // As `useSwipeable`'s style: it follows the finger and fades (only fades under reduce motion).
    const dx = swipeX.get();
    const swiped = 1 - Math.min(Math.abs(dx) / Math.max(width, 1), 1) * 0.6;
    return {
      opacity: ready ? fade.get() * swiped : 0,
      transform: [
        // Scaled about its centre: shift so the scaled box lands at x, y.
        { translateX: x - (hero - size) / 2 + (reduceMotion ? 0 : dx) },
        { translateY: y - (hero - size) / 2 },
        { scale: (size / hero) * paused.get() },
      ],
    };
  });
  const clip = useAnimatedStyle(() => ({
    borderRadius: big + (small - big) * progress.get(),
  }));

  return (
    <Animated.View
      style={[styles.hero, { width: hero, height: hero }, place]}
      pointerEvents="box-none"
    >
      <GestureDetector gesture={swipe.gesture}>
        <Animated.View
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Artwork, ${track.name}`}
          {...songSwipeActions}
          style={[ART_SHADOW, { borderRadius: big }]}
        >
          <Animated.View style={[styles.clip, clip]}>
            <NowPlayingArt image={track.image} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
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

/**
 * Title and credit, then the heart and the song menu. The text takes the
 * song swipe (and its screen reader actions); `compact` is the queue and
 * lyrics header beside the small artwork.
 */
function TrackTitle({
  track,
  compact,
  swipe,
}: {
  track: Queue;
  compact: boolean;
  swipe: Swipeable;
}) {
  const label = [track.name, track.explicit ? "Explicit" : null, track.subtitle]
    .filter(Boolean)
    .join(", ");
  return (
    <View className="flex-row items-center gap-2">
      <GestureDetector gesture={swipe.gesture}>
        <Animated.View
          accessible
          accessibilityLabel={label}
          {...songSwipeActions}
          className="flex-1"
          style={swipe.style}
        >
          <WashText
            variant={compact ? "headline" : TITLE_VARIANT}
            emphasized
            numberOfLines={1}
          >
            {track.name}
          </WashText>
          <View className="flex-row items-center gap-1">
            {track.explicit ? <ExplicitMark /> : null}
            <WashText tone="muted" numberOfLines={1} className="shrink">
              {track.subtitle}
            </WashText>
          </View>
        </Animated.View>
      </GestureDetector>
      {track.type === "song" ? (
        <LikeButton type="song" token={track.id} name={track.name} />
      ) : null}
      <SongMenu song={track}>
        <MenuTrigger label={`More actions for ${track.name}`} size="lg" />
      </SongMenu>
    </View>
  );
}

/** Where the queue comes from: today only a radio station names itself. */
function PlayingFrom() {
  const station = usePlayer((state) => state.radio?.name);
  if (!station) return null;
  return (
    <View
      accessible
      accessibilityLabel={`Playing ${station}`}
      className="items-center px-6"
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
 * The bar at the top that says the page pulls down (iOS's grabber); a
 * screen reader or a tap closes the player with it.
 */
function Grabber({ onPress }: { onPress: () => void }) {
  const wash = useWashColors();
  const muted = useTokenColor("muted-foreground");
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Close player"
      className="min-h-touch items-center justify-center"
    >
      <View
        className="rounded-full"
        style={{
          width: art.mini,
          height: space.xs,
          backgroundColor: wash?.muted ?? muted,
          opacity: 0.6,
        }}
      />
    </Pressable>
  );
}

/** An off pill's fill on a wash: its text colour at this opacity (the tonal skip buttons' tint). */
const PILL_TINT_ALPHA = 0.14;

/**
 * A queue mode as a capsule with its name (Apple Music's queue pills). On a
 * wash, on is the play button's checked `control` fill with `onControl`
 * text, off a faint tint of the foreground; on the D1 palette `primary` and
 * `muted`.
 */
function ModePill({
  icon,
  text,
  label,
  on,
  onPress,
}: {
  icon: SymbolName;
  text: string;
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  const wash = useWashColors();
  const token = useTokenColor(on ? "primary-foreground" : "foreground");
  const ink = wash ? (on ? wash.onControl : wash.foreground) : token;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      className={`min-h-touch flex-1 flex-row items-center justify-center gap-2 overflow-hidden rounded-full px-4 active:opacity-70 ${wash ? "" : on ? "bg-primary" : "bg-muted"}`}
    >
      {wash ? (
        <View
          className="absolute inset-0"
          style={{
            backgroundColor: on ? wash.control : wash.foreground,
            opacity: on ? 1 : PILL_TINT_ALPHA,
          }}
        />
      ) : null}
      <Icon name={icon} size="sm" color={ink} />
      <Text variant="subhead" emphasized color={ink} numberOfLines={1}>
        {text}
      </Text>
    </Pressable>
  );
}

/** The queue's modes: shuffle and repeat (transport leaves its own out here). */
function QueueModes() {
  const shuffle = usePlayer((state) => state.shuffle);
  const repeat = usePlayer((state) => state.repeat);
  const { toggleShuffle, cycleRepeat } = playerStore.getState();
  return (
    <View className="flex-row gap-2 px-6 pb-2">
      <ModePill
        icon={shuffleIcon(shuffle)}
        text="Shuffle"
        label="Shuffle"
        on={shuffle}
        onPress={toggleShuffle}
      />
      <ModePill
        icon={REPEAT_ICONS[repeat]}
        text={repeat === "track" ? "Repeat One" : "Repeat"}
        label={REPEAT_LABELS[repeat]}
        on={repeat !== "off"}
        onPress={() => cycleRepeat()}
      />
    </View>
  );
}

/** A view's box from its layout event. */
const boxOf = (event: LayoutChangeEvent) => event.nativeEvent.layout;

/**
 * Now Playing as a full page over the tabs (spec 2.10, D3 Ambient Tonal),
 * Apple Music's model: a grabber, then the artwork, title and heart, or with
 * Lyrics or Up next on, a compact header (the artwork flies into it) over the
 * lyrics or the queue; the scrubber, transport and the Lyrics / Up next
 * toggles stay put. Drag down anywhere outside a list to close it, swipe the
 * artwork or the title sideways to change the song. The view is the route's
 * `view` param, so `/player?view=queue` (and the `/queue` link) opens on the
 * queue. Text and controls, the queue's rows included (`OnWash`), take the
 * artwork wash's contrast-checked colours in every view; a missing or failed
 * wash leaves the D1 palette.
 */
export function FullPlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ view?: string }>();
  const view = playerViewOf(params.view);
  const compact = view !== "art";
  const track = usePlayer(selectCurrentTrack);
  const colors = usePlayerColors(track?.image);
  const washColors = colors;
  // One object per palette, so `OnWash`'s theme stays put between renders.
  const wash = useMemo(
    () => (washColors ? nowPlayingWash(washColors) : null),
    [washColors],
  );
  const background = useTokenColor("background");
  const paletteBackground = usePalette().background;
  const reduceMotion = useReducedMotion();

  const close = () => router.back();
  const setView = (next: PlayerView) =>
    router.setParams({ view: next === "art" ? undefined : next });
  const toggle = (next: PlayerView) => setView(view === next ? "art" : next);

  // The drag down to close, shared by the areas outside the lists.
  const drag = useSharedValue(0);
  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drag.get() }],
  }));
  const topPan = useDismissPan(drag, height, close);
  const bottomPan = useDismissPan(drag, height, close);

  // The sideways swipe that changes the song, on the artwork and the title.
  const swipeX = useSharedValue(0);
  const artSwipe = useSwipeable(swipeX, width);
  const titleSwipe = useSwipeable(swipeX, width);

  // The artwork's flight between the stage (0) and the compact header (1).
  const progress = useSharedValue(compact ? 1 : 0);
  const fade = useSharedValue(1);
  const slots: Slots = {
    stage: useSharedValue<LayoutRectangle | null>(null),
    header: useSharedValue<LayoutRectangle | null>(null),
  };
  useEffect(() => {
    const target = compact ? 1 : 0;
    if (progress.get() === target) return;
    if (reduceMotion) {
      // No flight: the artwork reappears in its new place with a crossfade.
      progress.set(target);
      fade.set(0);
      fade.set(
        withTiming(1, { duration: 200, reduceMotion: ReduceMotion.Never }),
      );
    } else progress.set(settle(target));
  }, [compact, reduceMotion, progress, fade]);

  // The lyrics' box, and where it spans down the backdrop (0 top, 1 bottom).
  const hero = playerArtSize(width);
  const [lyricsBox, setLyricsBox] = useState({ width: hero, height: hero });
  const root = useRef<ComponentRef<typeof View>>(null);
  const slot = useRef<ComponentRef<typeof View>>(null);
  const [span, setSpan] = useState<readonly [number, number] | null>(null);
  const measureLyrics = (event: LayoutChangeEvent) => {
    const { width: boxWidth, height: boxHeight } = boxOf(event);
    setLyricsBox({ width: boxWidth, height: boxHeight });
    root.current?.measureInWindow((_x, rootY, _width, rootHeight) =>
      slot.current?.measureInWindow((_slotX, y, _slotWidth, slotHeight) => {
        if (rootHeight > 0)
          setSpan([
            (y - rootY) / rootHeight,
            (y + slotHeight - rootY) / rootHeight,
          ]);
      }),
    );
  };

  const fill = washColors
    ? gradientFill(washColors.wash)
    : { key: "background", style: { backgroundColor: background } };

  if (!track) {
    return (
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top }}
        accessibilityViewIsModal
        onAccessibilityEscape={close}
      >
        <Grabber onPress={close} />
        <EmptyState
          icon={{ ios: "music.note", android: "music_note" }}
          title="Not playing"
          message="Play a song and it shows up here."
        />
      </View>
    );
  }

  // The lyrics fade into the fill: the wash's stops, or Android's D1
  // background (iOS's is a dynamic system colour with no hex to fade).
  // The wash's colour at the lyrics' own top and bottom, not the screen's.
  const lyricEdges = washColors
    ? span
      ? ([
          mixHex(washColors.wash, span[0]),
          mixHex(washColors.wash, span[1]),
        ] as const)
      : washColors.wash
    : Platform.OS === "android"
      ? ([paletteBackground, paletteBackground] as const)
      : null;

  return (
    <Animated.View style={[styles.page, dragStyle]}>
      {/* The tabs stay drawn underneath: keep a screen reader on this page. */}
      <View
        ref={root}
        className="flex-1"
        accessibilityViewIsModal
        onAccessibilityEscape={close}
      >
        <Backdrop fill={fill} />
        <OnWash colors={wash}>
          <GestureDetector gesture={topPan}>
            <View
              className={compact ? undefined : "flex-1"}
              style={{ paddingTop: insets.top }}
            >
              <Grabber onPress={close} />
              <PlayingFrom />
              {/* First, so a screen reader reads it before the title; it is
                  absolutely placed over its slot, which lets touches through. */}
              <HeroArt
                track={track}
                progress={progress}
                fade={fade}
                slots={slots}
                compact={compact}
                swipe={artSwipe}
                swipeX={swipeX}
              />
              {compact ? (
                <>
                  <View
                    className="flex-row items-center gap-3 px-6 py-2"
                    pointerEvents="box-none"
                    onLayout={(event) => slots.header.set(boxOf(event))}
                  >
                    {/* The artwork flies into this slot. */}
                    <View
                      pointerEvents="none"
                      style={{ width: COMPACT_ART, height: COMPACT_ART }}
                    />
                    <View className="flex-1">
                      <TrackTitle track={track} compact swipe={titleSwipe} />
                    </View>
                  </View>
                  {view === "queue" ? <QueueModes /> : null}
                </>
              ) : (
                <>
                  {/* The artwork's stage: it centres there, as large as fits. */}
                  <View
                    className="flex-1"
                    pointerEvents="none"
                    onLayout={(event) => slots.stage.set(boxOf(event))}
                  />
                  <View className="mt-8 px-6">
                    <TrackTitle
                      track={track}
                      compact={false}
                      swipe={titleSwipe}
                    />
                  </View>
                </>
              )}
            </View>
          </GestureDetector>
          {view === "queue" ? (
            <View className="flex-1">
              <QueueList />
            </View>
          ) : null}
          {view === "lyrics" ? (
            <View ref={slot} className="flex-1 px-6" onLayout={measureLyrics}>
              <PlayerLyrics
                track={track}
                width={Math.max(lyricsBox.width - 2 * space.xl, 0)}
                height={lyricsBox.height}
                edges={lyricEdges}
              />
            </View>
          ) : null}
          <View className="px-6 pt-4" style={{ paddingBottom: insets.bottom }}>
            {/* Outside the drag to close: a thumb grab that rolls down would
                otherwise close the player and cancel the native slider. */}
            <Scrubber />
            <GestureDetector gesture={bottomPan}>
              <View>
                <View className="mt-6">
                  <TransportControls modes={view !== "queue"} />
                </View>
                <View className="mt-2 flex-row items-center justify-between">
                  <ModeToggle
                    icon={{ ios: "quote.bubble", android: "lyrics" }}
                    label="Lyrics"
                    on={view === "lyrics"}
                    onPress={() => toggle("lyrics")}
                  />
                  <ModeToggle
                    icon={{ ios: "list.bullet", android: "queue_music" }}
                    label="Up next"
                    on={view === "queue"}
                    onPress={() => toggle("queue")}
                  />
                </View>
              </View>
            </GestureDetector>
          </View>
        </OnWash>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  hero: { position: "absolute", left: 0, top: 0 },
  clip: { overflow: "hidden" },
});
