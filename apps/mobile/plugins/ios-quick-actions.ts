// iOS home-screen quick actions (long-press the icon): the launcher shortcuts the
// Android plugin emits, from the same data. `expo-quick-actions` writes them to
// Info.plist and `useQuickActionRouting` (tabs layout) navigates to `params.href`.
// Node loads this through app.config.ts without a bundler: explicit extensions.
import {
  DEEP_LINK_SCHEME,
  SHORTCUTS,
  type ShortcutIcon,
} from "./android-app-actions/shortcuts.ts";

const SYMBOLS: Record<ShortcutIcon, string> = {
  play: "play.fill",
  heart: "heart.fill",
  search: "magnifyingglass",
  library: "books.vertical.fill",
  queue: "music.note.list",
  history: "clock.fill",
  trash: "trash",
};

/** `infinitunes://me/liked-songs` -> `/me/liked-songs`, a path the app routes. */
const hrefOf = (link: string) => link.replace(`${DEEP_LINK_SCHEME}:/`, "");

export function buildIosQuickActions() {
  return SHORTCUTS.filter((s) => s.launcher).map((s) => ({
    id: s.id,
    // One line, as iOS's own apps do ("New Message"): no subtitle repeating it.
    title: s.longLabel,
    icon: `symbol:${SYMBOLS[s.icon]}`,
    params: { href: hrefOf(s.link) },
  }));
}
