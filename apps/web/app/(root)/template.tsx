import type { ReactNode } from "react";
import { ViewTransition } from "react";

/**
 * A template remounts on every navigation, so the page content enters and
 * exits here while the layout (sidebar, toolbar, player) stays put. The
 * animations live in `styles/motion.css`.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="vt-page-in" exit="vt-page-out" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
