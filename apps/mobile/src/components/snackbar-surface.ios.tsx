import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { FadeInDown, FadeOut } from "react-native-reanimated";
import { FullWindowOverlay } from "react-native-screens";

import { GlassSurface } from "~/components/ui/glass-surface";
import { TEXT_BUTTON_HIT_SLOP } from "~/components/ui/hit-slop";
import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import type { Failure } from "~/lib/failure";
import { springs } from "~/theme/motion";
import { sizes } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";

/**
 * The banner's own window above the app's, so it also shows over Now Playing
 * and the sheets (native modals cover anything the root layout draws). It
 * passes touches outside the banner through.
 */
export function SnackbarLayer({ children }: { children: ReactNode }) {
  return <FullWindowOverlay>{children}</FullWindowOverlay>;
}

/** Rises a little on a soft spring, fades out. */
export const snackbarEntering = FadeInDown.springify()
  .stiffness(springs.spatialDefault.stiffness)
  .damping(springs.spatialDefault.damping);
export const snackbarExiting = FadeOut.duration(150);

/**
 * A Liquid Glass capsule (system material before iOS 26) with a warning
 * symbol, the message and an optional text action, like the system's HUDs.
 */
export function SnackbarSurface({
  failure,
  onAction,
}: {
  failure: Failure;
  onAction: () => void;
}) {
  const palette = usePalette();
  return (
    <GlassSurface
      style={{
        minHeight: sizes.touch,
        borderRadius: sizes.touch / 2,
        borderCurve: "continuous",
      }}
    >
      <View className="min-h-touch flex-row items-center gap-2 px-4 py-2">
        <View importantForAccessibility="no-hide-descendants">
          <Icon
            name="exclamationmark.circle.fill"
            size="md"
            color={palette.destructive}
          />
        </View>
        <Text variant="subhead" className="shrink">
          {failure.message}
        </Text>
        {failure.action ? (
          <Pressable
            onPress={onAction}
            hitSlop={TEXT_BUTTON_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={failure.action.label}
          >
            <Text variant="label" tone="primary">
              {failure.action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </GlassSurface>
  );
}
