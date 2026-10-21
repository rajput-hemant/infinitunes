import { useTheme } from "expo-router";
import { forwardRef } from "react";
import type { ComponentRef, ReactNode } from "react";
import { Platform, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";

import { Text } from "~/components/ui/text";
import { cx } from "~/lib/class-names";
import { typeScale } from "~/theme/tokens";

const inputTextStyle = {
  fontSize: Platform.select({
    ios: typeScale.ios.body.fontSize,
    default: typeScale.android.body.fontSize,
  }),
};

/** What a field's `ref` gives: focus the next field from `onSubmitEditing`. */
export type TextInputHandle = ComponentRef<typeof TextInput>;

export type FormFieldProps = Omit<TextInputProps, "style" | "className"> & {
  label: string;
  /** Validation message; replaces the hint while set. */
  error?: string;
  hint?: string;
  /** A control at the field's trailing edge, e.g. show password. */
  trailing?: ReactNode;
};

/** A labelled text input at the control height, with its message beneath. */
export const FormField = forwardRef<TextInputHandle, FormFieldProps>(
  function FormField(
    { label, error, hint, trailing, editable = true, ...inputProps },
    ref,
  ) {
    const { colors } = useTheme();
    const message = error ?? hint;

    return (
      <View className="gap-1.5">
        <Text variant="subhead" tone="muted">
          {label}
        </Text>
        <View
          className={cx(
            "h-ctl-lg flex-row items-center rounded-md bg-fill pl-4",
            !editable && "opacity-50",
          )}
        >
          <TextInput
            ref={ref}
            accessibilityLabel={label}
            accessibilityState={{ disabled: !editable }}
            editable={editable}
            selectionColor={colors.primary}
            style={[inputTextStyle, { color: colors.text }]}
            className="h-full flex-1"
            {...inputProps}
          />
          {trailing}
        </View>
        {message ? (
          <Text
            variant="caption"
            tone={error ? "error" : "muted"}
            accessibilityRole={error ? "alert" : undefined}
          >
            {message}
          </Text>
        ) : null}
      </View>
    );
  },
);
