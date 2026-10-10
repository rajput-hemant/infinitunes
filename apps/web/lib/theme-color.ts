import { SURFACES } from "~/lib/theme/accent";

/** The `--background` token (`styles/globals.css`) per scheme, for the static theme-color tags. */
export const THEME_COLOR = {
  light: SURFACES.light.background,
  dark: SURFACES.dark.background,
} as const;
