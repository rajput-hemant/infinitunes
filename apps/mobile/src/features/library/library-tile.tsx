import { Link } from "expo-router";
import type { Href } from "expo-router";
import { Platform, Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import { Icon } from "~/components/ui/icon";
import type { SymbolName } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { cx } from "~/lib/class-names";
import { usePressScale } from "~/lib/use-press-scale";
import { art } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";

/** Material's tiles sit on a tonal surface container; iOS's on a translucent fill. */
const MATERIAL = Platform.OS === "android";

type LibraryTileProps = {
  width: number;
  title: string;
  icon: SymbolName;
  href: Href;
  /** A count under the title ("12 songs"), when known. */
  detail?: string;
};

/** One of the hub's two large tiles (Liked Songs, Recently Played). */
export function LibraryTile({
  width,
  title,
  icon,
  href,
  detail,
}: LibraryTileProps) {
  const palette = usePalette();
  const press = usePressScale(0.97);
  return (
    <Animated.View style={[{ width }, press.style]}>
      <Link href={href} asChild>
        <Pressable
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          accessibilityRole="link"
          accessibilityLabel={[title, detail].filter(Boolean).join(", ")}
          className={cx(
            "justify-between gap-3 rounded-lg p-4",
            MATERIAL ? "bg-card" : "bg-fill",
          )}
          style={{ minHeight: art.feature }}
        >
          <View className="size-ctl items-center justify-center rounded-full bg-secondary">
            <Icon
              name={icon}
              size="md"
              color={
                MATERIAL ? palette["secondary-foreground"] : palette.primary
              }
            />
          </View>
          <View>
            <Text variant="headline" emphasized numberOfLines={1}>
              {title}
            </Text>
            {detail ? (
              <Text variant="subhead" tone="muted" numberOfLines={1}>
                {detail}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </Link>
    </Animated.View>
  );
}
