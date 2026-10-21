import type { ReactNode } from "react";

import { ScreenScrollView } from "~/components/screen-scroll-view";

/**
 * The scroll container of a form screen: it lifts the focused field above
 * the keyboard, lets a tap on a button land while the keyboard is open, and
 * dismisses the keyboard with a drag.
 */
export function FormScreen({ children }: { children: ReactNode }) {
  return (
    <ScreenScrollView
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-4 p-page"
    >
      {children}
    </ScreenScrollView>
  );
}
