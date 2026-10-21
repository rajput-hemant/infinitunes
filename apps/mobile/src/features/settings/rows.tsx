import { ListItem, Picker, Row, Spacer, Text } from "@expo/ui";
import type { PickerItemValue } from "@expo/ui";
import { useColorScheme } from "react-native";

import { Icon } from "~/components/ui/icon";
import { colors } from "~/theme/tokens";

type RowProps = {
  label: string;
  /** A second line under the label. */
  detail?: string;
  onPress: () => void;
};

/** A tappable row that opens another screen. */
export function NavigationRow({ label, detail, onPress }: RowProps) {
  return (
    <ListItem
      onPress={onPress}
      supportingText={detail}
      trailing={
        <Icon
          name={{ ios: "chevron.right", android: "chevron_right" }}
          size={14}
        />
      }
    >
      <Text>{label}</Text>
    </ListItem>
  );
}

/** A tappable row that does something now; `destructive` colours it red. */
export function ActionRow({
  label,
  detail,
  destructive = false,
  onPress,
}: RowProps & { destructive?: boolean }) {
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

/** A label with its current value, and the platform's menu to change it. */
export function PickerRow<Value extends PickerItemValue>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: Value;
  options: readonly { label: string; value: Value }[];
  onChange: (value: Value) => void;
}) {
  return (
    <Row>
      <Text>{label}</Text>
      <Spacer flexible />
      <Picker selectedValue={value} onValueChange={onChange}>
        {options.map((option) => (
          <Picker.Item
            key={option.value}
            label={option.label}
            value={option.value}
          />
        ))}
      </Picker>
    </Row>
  );
}

/** A label with a value that is not editable here. */
export function ValueRow({ label, value }: { label: string; value: string }) {
  return (
    <Row>
      <Text>{label}</Text>
      <Spacer flexible />
      <Text>{value}</Text>
    </Row>
  );
}
