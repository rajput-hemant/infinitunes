import { useTheme } from "expo-router";
import { forwardRef, useEffect } from "react";
import type { ComponentRef, ReactNode } from "react";
import { Platform, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";

import { Text } from "~/components/ui/text";
import { announce } from "~/lib/announce";
import { cx } from "~/lib/class-names";
import { typeScale } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";

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

/** A labelled text input at the touch height, with its message beneath. */
export const FormField = forwardRef<TextInputHandle, FormFieldProps>(
  function FormField(
    { label, error, hint, trailing, editable = true, ...inputProps },
    ref,
  ) {
    const { colors } = useTheme();
    const palette = usePalette();
    const message = error ?? hint;

    // A new error appears under the field; VoiceOver only hears it if told.
    useEffect(() => {
      if (error) announce(error);
    }, [error]);

    return (
      <View className="gap-2">
        <Text variant="subhead" tone="muted">
          {label}
        </Text>
        <View
          className={cx(
            "min-h-touch flex-row items-center rounded-md bg-fill pl-4",
            !editable && "opacity-50",
          )}
        >
          <TextInput
            ref={ref}
            accessibilityLabel={label}
            accessibilityHint={error ? `Error: ${error}` : hint}
            accessibilityState={{ disabled: !editable }}
            editable={editable}
            placeholderTextColor={palette["muted-foreground"]}
            selectionColor={colors.primary}
            style={[inputTextStyle, { color: colors.text }]}
            className="flex-1 py-3"
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
