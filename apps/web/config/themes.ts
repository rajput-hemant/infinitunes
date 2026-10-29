/**
 * Brand-neutral and spot colours. No longer user-selectable accents (the glass
 * tint colour drives the primary token, see `lib/theme/html.ts`); the browse
 * tiles still colour themselves from these.
 */
export const themes = [
  { name: "zinc", label: "Zinc", hex: "#18181b" },
  { name: "slate", label: "Slate", hex: "#0f172a" },
  { name: "stone", label: "Stone", hex: "#1c1917" },
  { name: "gray", label: "Gray", hex: "#111827" },
  { name: "neutral", label: "Neutral", hex: "#171717" },
  { name: "red", label: "Red", hex: "#dc2626" },
  { name: "rose", label: "Rose", hex: "#e11d48" },
  { name: "orange", label: "Orange", hex: "#f97316" },
  { name: "green", label: "Green", hex: "#16a34a" },
  { name: "blue", label: "Blue", hex: "#2563eb" },
  { name: "yellow", label: "Yellow", hex: "#facc15" },
  { name: "violet", label: "Violet", hex: "#7c3aed" },
] as const;

/** The neutral base of the stylesheet's default primary tokens (`styles/globals.css`). */
export const DEFAULT_ACCENT_HEX = "#171717";
