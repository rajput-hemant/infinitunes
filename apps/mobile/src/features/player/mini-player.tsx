import { useRouter } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { Pressable, useWindowDimensions, View } from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, { useSharedValue } from "react-native-reanimated";

import { Artwork } from "~/components/ui/artwork";
import { Icon } from "~/components/ui/icon";
import { WashText } from "~/components/wash";
import { selectCurrentTrack, usePlayer } from "~/playback/player-store";
import { art, maxFontScale, radii } from "~/theme/tokens";

import { songSwipeActions, useSwipeable } from "./gestures";
import { RadioBadge } from "./radio-badge";
import { NextTrackButton, PlayPauseButton } from "./transport-controls";

/** The "Not playing" placeholder: the mini artwork's frame. */
const PLACEHOLDER = {
  width: art.mini,
  height: art.mini,
  borderRadius: radii.sm,
};

/**
 * The compact player: the current track, play/pause and next, and a tap
 * target that opens the full player. It draws no background of its own; the
 * host supplies it (the iOS 26 tab bar accessory's glass, or the floating
 * dock, which on Android lays it on the artwork's tonal surface through
 * `OnWash`). The dock and the accessory have a fixed height, so text scales
 * only up to `maxFontScale.chrome`. `compact` drops Next, for the narrow
 * inline accessory. Swiping the track sideways changes the song (a tap
 * still opens the player).
 */
export function MiniPlayer({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const track = usePlayer(selectCurrentTrack);
  const { width } = useWindowDimensions();
  const swipe = useSwipeable(useSharedValue(0), width);

  const openPlayer = () => {
    router.push("/player");
  };

  return (
    <View className="flex-1 flex-row items-center pl-4 pr-1">
      {track ? (
        <GestureDetector gesture={swipe.gesture}>
          <Pressable
            onPress={openPlayer}
            accessibilityRole="button"
            accessibilityLabel={`Now playing ${track.name}, ${track.subtitle}`}
            accessibilityHint="Opens the player"
            {...songSwipeActions}
            className="flex-1"
          >
            <Animated.View
              className="flex-1 flex-row items-center gap-3"
              style={swipe.style}
            >
              <Artwork image={track.image} size="mini" />
              <View className="flex-1">
                <WashText
                  variant="subhead"
                  emphasized
                  numberOfLines={1}
                  maxFontSizeMultiplier={maxFontScale.chrome}
                >
                  {track.name}
                </WashText>
                <View className="flex-row items-center gap-1">
                  <RadioBadge />
                  <WashText
                    variant="caption"
                    tone="muted"
                    numberOfLines={1}
                    maxFontSizeMultiplier={maxFontScale.chrome}
                    className="flex-1"
                  >
                    {track.subtitle}
                  </WashText>
                </View>
              </View>
            </Animated.View>
          </Pressable>
        </GestureDetector>
      ) : (
        <View
          accessible
          accessibilityLabel="Not playing"
          className="flex-1 flex-row items-center gap-3"
        >
          <View
            className="items-center justify-center bg-muted"
            style={PLACEHOLDER}
          >
            <Icon
              name={{ ios: "music.note", android: "music_note" }}
              size="sm"
            />
          </View>
          <View className="flex-1">
            <WashText
              variant="subhead"
              emphasized
              numberOfLines={1}
              maxFontSizeMultiplier={maxFontScale.chrome}
            >
              Not playing
            </WashText>
          </View>
        </View>
      )}
      {track ? (
        <>
          <PlayPauseButton />
          {compact ? null : <NextTrackButton size="md" />}
        </>
      ) : null}
    </View>
  );
}

/**
 * The mini player in the iOS 26 tab bar accessory. Scrolling down minimizes
 * the tab bar and moves the accessory inline beside the selected tab, a much
 * narrower slot: there it keeps the art, the title and play/pause (Apple
 * Music's inline player). The system renders one copy per placement. UIKit
 * hosts it in the tab bar, outside the app's gesture root, so it brings its
 * own for the song swipe.
 */
export function AccessoryMiniPlayer() {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MiniPlayer compact={placement === "inline"} />
    </GestureHandlerRootView>
  );
}
