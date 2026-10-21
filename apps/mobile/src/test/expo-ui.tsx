import { Children, isValidElement } from "react";
import type { ReactNode } from "react";
import { Pressable, Text as NativeText, View } from "react-native";

/**
 * `@expo/ui` for screens that render its native lists (`jest.mock("@expo/ui", () =>
 * require("~/test/expo-ui"))`). Its real components are
 * opaque native views in Jest, so these stand in with plain React Native
 * ones that keep the same props: rows are buttons, a picker lists its
 * options as buttons that report `selected`.
 */

type WithChildren = { children?: ReactNode };

export function Host({ children }: WithChildren) {
  return <View>{children}</View>;
}

function Section({ title, children }: WithChildren & { title?: string }) {
  return (
    <View accessibilityLabel={title}>
      <NativeText>{title}</NativeText>
      {children}
    </View>
  );
}

export const FieldGroup = Object.assign(
  ({ children }: WithChildren) => <View>{children}</View>,
  { Section },
);

export const Text = NativeText;
export const Spacer = () => null;

/** A layout container; with `onPress` it is a tappable row, as natively. */
function Stack({
  children,
  onPress,
  testID,
}: WithChildren & { onPress?: () => void; testID?: string }) {
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} testID={testID}>
      {children}
    </Pressable>
  ) : (
    <View testID={testID}>{children}</View>
  );
}

export const Row = Stack;
export const Column = Stack;

export function ListItem({
  children,
  onPress,
  supportingText,
}: WithChildren & { onPress?: () => void; supportingText?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {children}
      {supportingText ? <NativeText>{supportingText}</NativeText> : null}
    </Pressable>
  );
}

type PickerItemProps = { label: string; value: string };

function PickerItem(_props: PickerItemProps) {
  return null;
}

export const Picker = Object.assign(
  ({
    selectedValue,
    onValueChange,
    children,
  }: WithChildren & {
    selectedValue: string;
    onValueChange: (value: string) => void;
  }) => (
    <View>
      {Children.map(children, (child) => {
        if (!isValidElement<PickerItemProps>(child)) return null;
        const { label, value } = child.props;
        return (
          <Pressable
            accessibilityRole="menuitem"
            accessibilityState={{ selected: value === selectedValue }}
            onPress={() => onValueChange(value)}
          >
            <NativeText>{label}</NativeText>
          </Pressable>
        );
      })}
    </View>
  ),
  { Item: PickerItem },
);
