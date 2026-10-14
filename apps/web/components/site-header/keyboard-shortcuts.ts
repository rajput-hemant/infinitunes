export type ShortcutEntry = {
  /** Key caps shown side by side, in the order pressed. A cap may list alternatives, e.g. "Left / Right". */
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

/** The modifier cap as written on the user's keyboard: Ctrl becomes Cmd on macOS. */
export function keyCapLabel(key: string, isMac: boolean): string {
  return isMac && key === "Ctrl" ? "⌘" : key;
}
