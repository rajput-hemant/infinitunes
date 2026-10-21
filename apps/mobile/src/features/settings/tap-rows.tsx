import { Column, Text } from "@expo/ui";
import { useColorScheme } from "react-native";

import { colors } from "~/theme/tokens";

import type { ActionRowProps, TapRowProps } from "./tap-row-props";

/**
 * Material 3 settings rows are plain tappable text. The list wraps each row
 * in its own Compose `ListItem`, so a `ListItem` here would nest inside it.
 */
export function ActionRow({
  label,
  detail,
  destructive = false,
  onPress,
}: ActionRowProps) {
  const palette = colors[useColorScheme() === "dark" ? "dark" : "light"];

  return (
    <Column onPress={onPress}>
      <Text
        textStyle={destructive ? { color: palette.destructive } : undefined}
      >
        {label}
      </Text>
      {detail ? (
        <Text textStyle={{ color: palette["muted-foreground"] }}>{detail}</Text>
      ) : null}
    </Column>
  );
}

/** A tappable row that opens another screen (no chevron on Material). */
export function NavigationRow(props: TapRowProps) {
  return <ActionRow {...props} />;
}
