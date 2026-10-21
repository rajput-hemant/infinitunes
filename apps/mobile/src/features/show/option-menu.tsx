import { MenuView } from "@expo/ui/community/menu";
import { View } from "react-native";

import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";

type Option = { id: string; title: string };

type OptionMenuProps = {
  /** Names the choice for screen readers ("Season", "Order"). */
  label: string;
  options: readonly Option[];
  selectedId: string;
  onSelect: (id: string) => void;
  testID?: string;
};

/** A one-of-many choice in the platform menu; its trigger shows the current option. */
export function OptionMenu({
  label,
  options,
  selectedId,
  onSelect,
  testID,
}: OptionMenuProps) {
  const selected = options.find((option) => option.id === selectedId);

  return (
    <MenuView
      testID={testID}
      title={label}
      actions={options.map(({ id, title }) => ({
        id,
        title,
        state: id === selectedId ? "on" : "off",
      }))}
      onPressAction={({ nativeEvent }) => onSelect(nativeEvent.event)}
    >
      <View
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.title ?? ""}`}
        className="h-ctl flex-row items-center gap-1.5 rounded-lg bg-secondary px-3"
      >
        <Text variant="subhead">{selected?.title ?? label}</Text>
        <Icon
          name={{ ios: "chevron.up.chevron.down", android: "unfold_more" }}
          size={12}
        />
      </View>
    </MenuView>
  );
}
