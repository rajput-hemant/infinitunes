import type { ReactNode } from "react";
import { ViewTransition } from "react";

/**
 * The one view transition boundary for the pages. It sits in the template, so
 * it sees every navigation, a different route (it remounts) or the same route
 * with other params, a tab or a search type (its content changes in place), and
 * every skeleton giving way to the content that was loading (`update`). It does
 * not name its wrapper: `styles/motion.css` sets `view-transition-name: none` on
 * `[data-vt-page]`, so the page is part of the root snapshot and the shell
 * crossfades with it, pixel for pixel the same on both sides. Naming the page
 * would snapshot its full height (the whole document, not the viewport) and
 * lift it out of the root, so the glass toolbar and player above it would
 * lose the content they blur.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition default="vt-page">
      <div data-vt-page="">{children}</div>
    </ViewTransition>
  );
}
