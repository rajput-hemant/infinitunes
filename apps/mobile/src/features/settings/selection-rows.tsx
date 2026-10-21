import { Picker, Row, Spacer, Text } from "@expo/ui";
import type { PickerItemValue } from "@expo/ui";

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
