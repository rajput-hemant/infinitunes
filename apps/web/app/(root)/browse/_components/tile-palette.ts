import { DEFAULT_ACCENT_HEX, themes } from "~/config/themes";

const NEAR_BLACK_OR_PALE = new Set(["zinc", "stone", "neutral", "yellow"]);

const tileColors = themes
  .filter(({ name }) => !NEAR_BLACK_OR_PALE.has(name))
  .map(({ hex }) => hex);

export function tileColor(index: number): string {
  return tileColors[index % tileColors.length] ?? DEFAULT_ACCENT_HEX;
}

export function tileGradient(index: number): string {
  return `linear-gradient(135deg, ${tileColor(index)}, ${tileColor(index + 3)})`;
}
