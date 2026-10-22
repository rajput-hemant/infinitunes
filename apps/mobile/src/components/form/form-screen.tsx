import type { ReactNode } from "react";

import { ScreenScrollView } from "~/components/screen-scroll-view";

/**
 * The scroll container of a form screen: it lifts the focused field above
 * the keyboard, lets a tap on a button land while the keyboard is open, and
 * dismisses the keyboard with a drag. The form is at most `sizes.readable`
 * wide, centred.
 */
export function FormScreen({ children }: { children: ReactNode }) {
  return (
    <ScreenScrollView
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="w-full max-w-readable gap-4 self-center p-page"
    >
      {children}
    </ScreenScrollView>
  );
}
