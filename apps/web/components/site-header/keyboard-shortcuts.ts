export type ShortcutEntry = {
  /** Each inner array is one key cap; entries are alternatives shown with "or". */
  keys: string[];
  action: string;
};

/** Mirrors the handlers in `components/player.tsx` and `search/search-menu.tsx`. */
export const keyboardShortcuts: ShortcutEntry[] = [
  { keys: ["Space"], action: "Play or pause" },
  { keys: ["N"], action: "Next track" },
  { keys: ["P"], action: "Previous track" },
  { keys: ["L"], action: "Toggle repeat" },
  { keys: ["S"], action: "Shuffle" },
  { keys: ["Q"], action: "Toggle queue" },
  { keys: ["Shift", "Left / Right"], action: "Previous / next track" },
  { keys: ["Shift", "Up / Down"], action: "Volume" },
  { keys: ["Ctrl", "K"], action: "Search" },
  { keys: ["Esc"], action: "Close" },
];
