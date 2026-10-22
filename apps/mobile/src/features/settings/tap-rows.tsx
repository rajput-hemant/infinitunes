import { ListItem, Text } from "@expo/ui";

import { Icon } from "~/components/ui/icon";
import { usePalette } from "~/theme/use-palette";

import { RowIcon } from "./row-icon.ios";
import type { ActionRowProps, TapRowProps } from "./tap-row-props";

/** A tappable row that opens another screen, with a disclosure chevron. */
export function NavigationRow({ label, detail, icon, onPress }: TapRowProps) {
  const palette = usePalette();
  return (
    <ListItem
      onPress={onPress}
      supportingText={detail}
      leading={icon ? <RowIcon {...icon} /> : undefined}
      trailing={
        <Icon
          name="chevron.forward"
          size="sm"
          color={palette["muted-foreground"]}
        />
      }
    >
      <Text>{label}</Text>
    </ListItem>
  );
}

/** A tappable row that does something now. */
export function ActionRow({
  label,
  detail,
  icon,
  destructive = false,
  onPress,
}: ActionRowProps) {
  const palette = usePalette();

  return (
    <ListItem
      onPress={onPress}
      supportingText={detail}
      leading={icon ? <RowIcon {...icon} /> : undefined}
    >
      <Text
        textStyle={destructive ? { color: palette.destructive } : undefined}
      >
        {label}
      </Text>
    </ListItem>
  );
}
