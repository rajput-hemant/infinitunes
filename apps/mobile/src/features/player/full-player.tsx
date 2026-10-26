import type { Queue } from "@infinitunes/types";
import { getImageSrc } from "@infinitunes/types";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, useTheme } from "expo-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ComponentRef, ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import type {
  ColorValue,
  LayoutChangeEvent,
  LayoutRectangle,
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
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
import { announce } from "~/lib/announce";
import { selection } from "~/lib/haptics";
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
import { useFavoriteToggle } from "~/user-data/favorites";

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

/** The artwork's flight between the stage and the compact header. */
const FLIGHT_MS = 420;
/** Material's emphasized decelerate, close to Apple Music's flight: fast off, long settle. */
const EMPHASIZED = Easing.bezier(0.2, 0, 0, 1);
/** How long a flight waits for a destination slot that reports no new layout. */
const LAYOUT_WAIT_MS = 34;

/** The flight: one timing curve on both platforms (a spring's overshoot reads as a wobble on a scale). */
function fly(target: number) {
  return withTiming(target, { duration: FLIGHT_MS, easing: EMPHASIZED });
}

/** Starts the pending flight, if one waits. */
function takeOff(
  pending: { current: 0 | 1 | null },
  progress: SharedValue<number>,
) {
  const target = pending.current;
  if (target === null) return;
  pending.current = null;
  progress.set(fly(target));
}

/**
 * What enters and leaves with the flight (titles, pills, the list): a fade
 * with a short rise over the flight's span, a fade alone under reduce motion.
 */
const contentIn = (reduceMotion: boolean) =>
  reduceMotion
    ? FadeIn.duration(200).reduceMotion(ReduceMotion.Never)
    : FadeInDown.duration(FLIGHT_MS - 80)
        .delay(80)
        .easing(EMPHASIZED)
        .withInitialValues({ transform: [{ translateY: space.lg }] });
const contentOut = FadeOut.duration(140).reduceMotion(ReduceMotion.Never);

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
  // The same radius for the shadow (one animated style per view).
  const shadowShape = useAnimatedStyle(() => ({
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
          style={[ART_SHADOW, shadowShape]}
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
 * Title and credit, then (in the large view) the heart and the song menu. The text takes the
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
          <View className="flex-row items-center gap-1">
            {track.explicit ? <ExplicitMark /> : null}
            <WashText
              variant={compact ? "headline" : TITLE_VARIANT}
              emphasized
              numberOfLines={1}
              className="shrink"
            >
              {track.name}
            </WashText>
          </View>
          <WashText tone="muted" numberOfLines={1}>
            {track.subtitle}
          </WashText>
        </Animated.View>
      </GestureDetector>
      {/* The compact header's heart and menu sit in its pill row. */}
      {compact ? null : (
        <>
          {track.type === "song" ? (
            <LikeButton type="song" token={track.id} name={track.name} />
          ) : null}
          <SongMenu song={track}>
            <MenuTrigger label={`More actions for ${track.name}`} size="lg" />
          </SongMenu>
        </>
      )}
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
 * One capsule of the compact header's row (Apple Music's queue pills): a
 * `flex-1` container that carries the shape and fill, so all four are the
 * same size whatever sits inside (a button, or the @expo/ui menu, which
 * ignores flex from outside). On a wash, on is the play button's checked
 * `control` fill with an `onControl` glyph, off a faint tint of the
 * foreground; on the D1 palette `primary` and `muted`. `children` gets the
 * glyph's ink.
 */
function PillFrame({
  on = false,
  children,
}: {
  on?: boolean;
  children: (ink: ColorValue) => ReactNode;
}) {
  const wash = useWashColors();
  const token = useTokenColor(on ? "primary-foreground" : "foreground");
  const ink = wash ? (on ? wash.onControl : wash.foreground) : token;
  return (
    <View
      testID="header-pill"
      className={`min-h-touch flex-1 items-center justify-center overflow-hidden rounded-full ${wash ? "" : on ? "bg-primary" : "bg-muted"}`}
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
      {children(ink)}
    </View>
  );
}

/** A pill that is a button: a mode (`on` set) or the heart. `color` overrides the off glyph (a liked heart). */
function Pill({
  icon,
  label,
  on,
  color,
  onPress,
}: {
  icon: SymbolName;
  label: string;
  on?: boolean;
  color?: ColorValue;
  onPress: () => void;
}) {
  return (
    <PillFrame on={on}>
      {(ink) => (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={on === undefined ? undefined : { selected: on }}
          className="w-full flex-1 items-center justify-center active:opacity-70"
        >
          <Icon name={icon} size="md" color={on ? ink : (color ?? ink)} />
        </Pressable>
      )}
    </PillFrame>
  );
}

/** The heart as a pill: the same optimistic like as `LikeButton`. */
function LikePill({ track }: { track: Queue }) {
  const { colors } = useTheme();
  const { liked, toggle } = useFavoriteToggle({
    type: "song",
    token: track.id,
  });
  return (
    <Pill
      icon={
        liked
          ? { ios: "heart.fill", android: "favorite" }
          : { ios: "heart", android: "favorite_border" }
      }
      label={liked ? `Unlike ${track.name}` : `Like ${track.name}`}
      color={liked ? colors.primary : undefined}
      onPress={() => {
        const nowLiked = toggle();
        if (nowLiked !== undefined) {
          announce(
            nowLiked
              ? `Liked ${track.name}`
              : `Removed ${track.name} from liked`,
          );
        }
      }}
    />
  );
}

/**
 * The compact header's row (queue and lyrics): the heart, shuffle, repeat,
 * and the song menu as four equal capsules, Apple Music's layout. Transport
 * leaves its own shuffle and repeat out here.
 */
function HeaderControls({ track }: { track: Queue }) {
  const shuffle = usePlayer((state) => state.shuffle);
  const repeat = usePlayer((state) => state.repeat);
  const { toggleShuffle, cycleRepeat } = playerStore.getState();
  return (
    <View className="flex-row gap-2 px-6 pb-2">
      {track.type === "song" ? <LikePill track={track} /> : null}
      <Pill
        icon={shuffleIcon(shuffle)}
        label="Shuffle"
        on={shuffle}
        onPress={() => {
          selection();
          toggleShuffle();
        }}
      />
      <Pill
        icon={REPEAT_ICONS[repeat]}
        label={REPEAT_LABELS[repeat]}
        on={repeat !== "off"}
        onPress={() => {
          selection();
          cycleRepeat();
        }}
      />
      <PillFrame>
        {(ink) => (
          <SongMenu song={track} style={styles.fill}>
            <View
              accessible
              accessibilityRole="button"
              accessibilityLabel={`More actions for ${track.name}`}
              accessibilityHint="Opens a menu"
              className="items-center justify-center active:opacity-70"
              style={styles.fill}
            >
              <View
                style={Platform.select({
                  ios: { transform: [{ rotate: "90deg" }] },
                })}
              >
                <Icon
                  name={{ ios: "ellipsis", android: "more_vert" }}
                  size="md"
                  color={ink}
                />
              </View>
            </View>
          </SongMenu>
        )}
      </PillFrame>
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
  const linkedView = playerViewOf(params.view);
  // Local state, so a toggle re-renders only this screen (a route param
  // change goes through the navigator); a new `?view=` link still switches it.
  const [view, setView] = useState(linkedView);
  const [shownLink, setShownLink] = useState(linkedView);
  if (shownLink !== linkedView) {
    setShownLink(linkedView);
    setView(linkedView);
  }
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
  // The rounded top of a card sheet (the system sheet it replaced); the
  // page clips the wash to it.
  const sheetCorner = useRadii().xl;
  const pageCorners = {
    borderTopLeftRadius: sheetCorner,
    borderTopRightRadius: sheetCorner,
  };

  const close = () => router.back();
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
  // A flight waits for its destination slot's first layout, so both ends are
  // known before it starts and nothing is measured mid-flight.
  const pending = useRef<0 | 1 | null>(null);
  const landed = (slot: 0 | 1) => {
    if (pending.current === slot) takeOff(pending, progress);
  };
  useLayoutEffect(() => {
    const target = compact ? 1 : 0;
    // A toggle that lands before the other view measured cancels that flight,
    // so its queued layout cannot start one for the view it left.
    pending.current = null;
    if (progress.get() === target) return;
    if (reduceMotion) {
      // No flight: the artwork reappears in its new place with a crossfade.
      progress.set(target);
      fade.set(0);
      fade.set(
        withTiming(1, { duration: 200, reduceMotion: ReduceMotion.Never }),
      );
      return;
    }
    pending.current = target;
    // The slot is already laid out (no new layout event): fly anyway.
    const timer = setTimeout(() => takeOff(pending, progress), LAYOUT_WAIT_MS);
    return () => clearTimeout(timer);
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
        style={[styles.page, pageCorners, { paddingTop: insets.top }]}
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
    <Animated.View style={[styles.page, pageCorners, dragStyle]}>
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
                    onLayout={(event) => {
                      slots.header.set(boxOf(event));
                      landed(1);
                    }}
                  >
                    {/* The artwork flies into this slot. */}
                    <View
                      pointerEvents="none"
                      style={{ width: COMPACT_ART, height: COMPACT_ART }}
                    />
                    <Animated.View
                      className="flex-1"
                      entering={contentIn(reduceMotion)}
                      exiting={contentOut}
                    >
                      <TrackTitle track={track} compact swipe={titleSwipe} />
                    </Animated.View>
                  </View>
                  <Animated.View
                    entering={contentIn(reduceMotion)}
                    exiting={contentOut}
                  >
                    <HeaderControls track={track} />
                  </Animated.View>
                </>
              ) : (
                <>
                  {/* The artwork's stage: it centres there, as large as fits. */}
                  <View
                    className="flex-1"
                    pointerEvents="none"
                    onLayout={(event) => {
                      slots.stage.set(boxOf(event));
                      landed(0);
                    }}
                  />
                  <Animated.View
                    className="mt-8 px-6"
                    entering={contentIn(reduceMotion)}
                    exiting={contentOut}
                  >
                    <TrackTitle
                      track={track}
                      compact={false}
                      swipe={titleSwipe}
                    />
                  </Animated.View>
                </>
              )}
            </View>
          </GestureDetector>
          {view === "queue" ? (
            <Animated.View
              className="flex-1"
              entering={contentIn(reduceMotion)}
              exiting={contentOut}
            >
              <QueueList />
            </Animated.View>
          ) : null}
          {view === "lyrics" ? (
            <Animated.View
              ref={slot}
              className="flex-1 px-6"
              onLayout={measureLyrics}
              entering={contentIn(reduceMotion)}
              exiting={contentOut}
            >
              <PlayerLyrics
                track={track}
                width={Math.max(lyricsBox.width - 2 * space.xl, 0)}
                height={lyricsBox.height}
                edges={lyricEdges}
              />
            </Animated.View>
          ) : null}
          <View className="px-6 pt-4" style={{ paddingBottom: insets.bottom }}>
            {/* Outside the drag to close: a thumb grab that rolls down would
                otherwise close the player and cancel the native slider. */}
            <Scrubber />
            <GestureDetector gesture={bottomPan}>
              <View>
                <View className="mt-6">
                  <TransportControls modes={!compact} />
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
  page: { flex: 1, overflow: "hidden" },
  hero: { position: "absolute", left: 0, top: 0 },
  clip: { overflow: "hidden" },
  fill: { flex: 1, width: "100%", height: "100%" },
});
