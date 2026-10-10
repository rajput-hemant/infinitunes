import type { HeadingFontId } from "@infinitunes/types";

/**
 * Selectable faces. `family` is the custom property next/font defines on
 * `<html>` (see `lib/fonts.ts`), usable as `font-family` for previews;
 * the live mapping to `--font-sans` and `--font-heading` is in `globals.css`.
 */
export const FONT_FACES: Record<
  HeadingFontId,
  { label: string; family: string }
> = {
  display: { label: "Display", family: "var(--font-cal-sans)" },
  system: { label: "System", family: "var(--font-inter)" },
  rounded: { label: "Rounded", family: "var(--font-nunito)" },
  grotesk: { label: "Grotesk", family: "var(--font-hanken-grotesk)" },
  serif: { label: "Serif", family: "var(--font-source-serif)" },
  mono: { label: "Mono", family: "var(--font-jetbrains-mono)" },
};
