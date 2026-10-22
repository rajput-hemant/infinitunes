import { useEffect } from "react";
import type { RefObject } from "react";
import { Platform, View } from "react-native";

import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { announce } from "~/lib/announce";
import { cx } from "~/lib/class-names";
import { usePalette } from "~/theme/use-palette";

import type { TextInputHandle } from "./form-field";

/**
 * Why the server refused a form, shown above its submit button: an error
 * mark and the message, in line with the fields' own messages (Android's
 * outlined field insets them by its inner padding). Nothing when `message`
 * is unset.
 */
export function FormError({ message }: { message?: string }) {
  const palette = usePalette();
  useEffect(() => {
    if (message) announce(message);
  }, [message]);
  if (!message) return null;
  return (
    <View
      className={cx(
        "flex-row items-start gap-2",
        Platform.OS === "android" && "px-4",
      )}
    >
      <View importantForAccessibility="no-hide-descendants" className="pt-px">
        <Icon
          name={{ ios: "exclamationmark.circle", android: "error" }}
          size="sm"
          color={palette.destructive}
        />
      </View>
      <Text
        variant="footnote"
        tone="error"
        accessibilityRole="alert"
        className="flex-1"
      >
        {message}
      </Text>
    </View>
  );
}

/**
 * After a server refusal, puts the cursor back in the form's first field.
 * Waits for `pending` to clear: a field is not editable while the request
 * runs, and Android ignores `focus()` on one that is not.
 */
export function useFocusOnRefusal(
  field: RefObject<TextInputHandle | null>,
  message: string | undefined,
  pending: boolean,
) {
  useEffect(() => {
    if (message && !pending) field.current?.focus();
  }, [field, message, pending]);
}
