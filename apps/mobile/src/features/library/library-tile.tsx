import type { Href } from "expo-router";
import { Platform, View } from "react-native";

import { PressableTile } from "~/components/pressable-tile";
import { Icon } from "~/components/ui/icon";
import type { SymbolName } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { cx } from "~/lib/class-names";
import { art } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";

/** Android: an ink tile (an `outlineVariant` hairline on the page); iOS: a translucent fill. */
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
  return (
    <PressableTile
      width={width}
      href={href}
      accessibilityLabel={[title, detail].filter(Boolean).join(", ")}
      className={cx(
        "justify-between gap-3 rounded-lg p-4",
        MATERIAL ? "border border-border" : "bg-fill",
      )}
      style={{ minHeight: art.feature }}
    >
      <View className="size-ctl items-center justify-center rounded-full bg-secondary">
        <Icon
          name={icon}
          size="md"
          color={MATERIAL ? palette["secondary-foreground"] : palette.primary}
        />
      </View>
      <View>
        <Text variant="headline" emphasized numberOfLines={1}>
          {title}
        </Text>
        {/* Always two lines, so both tiles match and nothing moves when a count lands. */}
        <Text variant="subhead" tone="muted" numberOfLines={1}>
          {detail ?? " "}
        </Text>
      </View>
    </PressableTile>
  );
}
