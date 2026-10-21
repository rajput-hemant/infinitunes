import type { ReactNode } from "react";

/** Only Android has wallpaper colours (`dynamic-color-root.android.tsx`); iOS uses UIKit's. */
export function DynamicColorRoot({ children }: { children: ReactNode }) {
  return children;
}
