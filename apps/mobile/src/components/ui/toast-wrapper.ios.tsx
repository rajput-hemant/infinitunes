import { isValidElement, useEffect } from "react";
import type { ComponentProps } from "react";
import type { ToasterProps } from "sonner-native";

import { announce } from "~/lib/announce";

type ToastWrapperProps = ComponentProps<
  NonNullable<ToasterProps["ToastWrapper"]>
>;

/** The words of a toast: its title and description, as the Toaster gave them to the toast. */
function toastText(toast: ToastWrapperProps["children"]): string | undefined {
  if (!isValidElement<{ title?: unknown; description?: unknown }>(toast)) {
    return undefined;
  }
  const { title, description } = toast.props;
  const words = [title, description].filter(
    (part): part is string => typeof part === "string" && part !== "",
  );
  return words.length > 0 ? words.join(". ") : undefined;
}

/**
 * sonner-native marks a toast as a live region, which only Android speaks.
 * On iOS this announces each toast, and again whenever its text changes (a
 * promise toast going from loading to done).
 */
export function AnnouncingToast({ children }: ToastWrapperProps) {
  const text = toastText(children);
  useEffect(() => {
    if (text) announce(text);
  }, [text]);
  return children;
}
