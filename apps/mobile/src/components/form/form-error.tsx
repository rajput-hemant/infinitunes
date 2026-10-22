import { useEffect } from "react";

import { Text } from "~/components/ui/text";
import { announce } from "~/lib/announce";

/** Why the server refused a form, shown above its submit button; nothing when `message` is unset. */
export function FormError({ message }: { message?: string }) {
  useEffect(() => {
    if (message) announce(message);
  }, [message]);
  if (!message) return null;
  return (
    <Text variant="footnote" tone="error" accessibilityRole="alert">
      {message}
    </Text>
  );
}
