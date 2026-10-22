import { Picker, Row, Spacer, Switch, Text } from "@expo/ui";
import type { PickerItemValue } from "@expo/ui";

import { RowIcon } from "./row-icon";
import type { TapRowProps } from "./tap-row-props";

/** A label with its current value, and the platform's menu to change it. */
export function PickerRow<Value extends PickerItemValue>({
  label,
  icon,
  value,
  options,
  onChange,
}: {
  label: string;
  icon?: TapRowProps["icon"];
  value: Value;
  options: readonly { label: string; value: Value }[];
  onChange: (value: Value) => void;
}) {
  return (
    <Row alignment="center" spacing={12}>
      {icon ? <RowIcon {...icon} /> : null}
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
export function ValueRow({
  label,
  icon,
  value,
}: {
  label: string;
  icon?: TapRowProps["icon"];
  value: string;
}) {
  return (
    <Row alignment="center" spacing={12}>
      {icon ? <RowIcon {...icon} /> : null}
      <Text>{label}</Text>
      <Spacer flexible />
      <Text>{value}</Text>
    </Row>
  );
}

export function SwitchRow({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon?: TapRowProps["icon"];
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Row alignment="center" spacing={12}>
      {icon ? <RowIcon {...icon} /> : null}
      <Switch label={label} value={value} onValueChange={onChange} />
    </Row>
  );
}
