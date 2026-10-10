/**
 * Tint alpha per colour scheme while the theme leaves `glassTuning.tint` null.
 * `styles/glass.css` keeps the same literals (`--glass-tint` under `:root` and
 * `.dark`); a test keeps the two in step.
 */
export const DEFAULT_GLASS_TINT = { light: 0.14, dark: 0.24 } as const;
