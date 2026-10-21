import { ListItem, Text } from "@expo/ui";
import { useColorScheme } from "react-native";

import { Icon } from "~/components/ui/icon";
import { colors } from "~/theme/tokens";

import type { ActionRowProps, TapRowProps } from "./tap-row-props";

/** A tappable row that opens another screen, with a disclosure chevron. */
export function NavigationRow({ label, detail, onPress }: TapRowProps) {
  return (
    <ListItem
      onPress={onPress}
      supportingText={detail}
      trailing={<Icon name="chevron.right" size={14} />}
    >
      <Text>{label}</Text>
    </ListItem>
  );
}

/** A tappable row that does something now. */
export function ActionRow({
  label,
  detail,
  destructive = false,
  onPress,
}: ActionRowProps) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";

  return (
    <ListItem onPress={onPress} supportingText={detail}>
      <Text
        textStyle={
          destructive ? { color: colors[scheme].destructive } : undefined
        }
      >
        {label}
      </Text>
    </ListItem>
  );
}
