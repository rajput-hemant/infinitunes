import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Easing, FadeOut, Keyframe } from "react-native-reanimated";

import { TEXT_BUTTON_HIT_SLOP } from "~/components/ui/hit-slop";
import { Text } from "~/components/ui/text";
import type { Failure } from "~/lib/failure";
import { sizes } from "~/theme/tokens";
import { useTokenColor } from "~/theme/use-palette";
import { useRadii } from "~/theme/use-radii";

/** Android draws the snackbar in the app's own window: no overlay needed. */
export function SnackbarLayer({ children }: { children: ReactNode }) {
  return children;
}

/** Material's snackbar: fades in while it scales up from 80%, fades out. */
export const snackbarEntering = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.8 }] },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.out(Easing.cubic),
  },
}).duration(150);
export const snackbarExiting = FadeOut.duration(75);

/** Material 3 elevation level 3. */
const ELEVATION = 6;

/**
 * A Material 3 snackbar: an inverse surface (the text colour as the fill, the
 * page colour as the text, so the pair keeps its AA contrast), bodyMedium
 * copy and an optional text action.
 */
export function SnackbarSurface({
  failure,
  onAction,
}: {
  failure: Failure;
  onAction: () => void;
}) {
  const fill = useTokenColor("foreground");
  const ink = useTokenColor("background");
  const corner = useRadii();
  return (
    <View
      className="flex-row items-center gap-2 py-3 pl-4 pr-2"
      style={{
        minHeight: sizes.touch,
        backgroundColor: fill,
        borderRadius: corner.xs,
        elevation: ELEVATION,
      }}
    >
      <Text variant="subhead" color={ink} className="flex-1">
        {failure.message}
      </Text>
      {failure.action ? (
        <Pressable
          onPress={onAction}
          hitSlop={TEXT_BUTTON_HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel={failure.action.label}
          className="px-2"
        >
          <Text variant="label" emphasized color={ink}>
            {failure.action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
