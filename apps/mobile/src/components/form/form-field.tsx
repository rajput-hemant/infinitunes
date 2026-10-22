import { useTheme } from "expo-router";
import { forwardRef, useEffect, useState } from "react";
import type { ComponentRef, ReactNode } from "react";
import { Platform, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";

import { Text } from "~/components/ui/text";
import { announce } from "~/lib/announce";
import { cx } from "~/lib/class-names";
import { space, typeScale } from "~/theme/tokens";
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
    {
      label,
      error,
      hint,
      trailing,
      editable = true,
      onFocus,
      onBlur,
      ...inputProps
    },
    ref,
  ) {
    const { colors } = useTheme();
    const palette = usePalette();
    const message = error ?? hint;
    const [focused, setFocused] = useState(false);
    // Android: Material 3's outlined text field, its label set into the
    // outline, which thickens and takes the accent (or the error colour)
    // while focused.
    const outlined = Platform.OS === "android";

    // A new error appears under the field; VoiceOver only hears it if told.
    useEffect(() => {
      if (error) announce(error);
    }, [error]);

    return (
      <View className={outlined ? "gap-1" : "gap-2"}>
        {outlined ? null : (
          <Text variant="subhead" tone="muted">
            {label}
          </Text>
        )}
        <View
          className={cx(
            "min-h-touch flex-row items-center pl-4",
            outlined
              ? cx("min-h-row rounded-xs border-input")
              : "rounded-md bg-fill",
            !editable && "opacity-50",
          )}
          style={outlined ? { borderWidth: 1, marginTop: space.sm } : undefined}
        >
          {outlined && (focused || error) ? (
            // The 2dp focus/error ring is drawn over the 1dp border, so the
            // field's layout never shifts by the extra pixel.
            <View
              pointerEvents="none"
              className={cx(
                "absolute rounded-xs border-2",
                error ? "border-destructive" : "border-primary",
              )}
              style={{ top: -1, left: -1, right: -1, bottom: -1 }}
            />
          ) : null}
          {outlined ? (
            <Text
              variant="caption"
              tone={error ? "error" : focused ? "primary" : "muted"}
              importantForAccessibility="no"
              className="absolute bg-background px-1"
              style={{
                top: -space.sm - 1,
                left: space.md,
              }}
            >
              {label}
            </Text>
          ) : null}
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
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            {...inputProps}
          />
          {trailing}
        </View>
        {message ? (
          <Text
            variant="caption"
            tone={error ? "error" : "muted"}
            accessibilityRole={error ? "alert" : undefined}
            className={outlined ? "px-4" : undefined}
          >
            {message}
          </Text>
        ) : null}
      </View>
    );
  },
);
