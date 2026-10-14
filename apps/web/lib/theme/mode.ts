/**
 * Colour-mode switching that repaints on the next frame.
 *
 * next-themes applies the `light`/`dark` class in an effect, after React has
 * rendered, and every colour transition in the app would then ease through the
 * old colours for 150 to 250ms. So a switch sets the class here, inside the
 * click, and holds transitions off for exactly one frame. `setTheme` still runs,
 * which persists the choice and keeps next-themes' state in step; its effect
 * then re-applies the same class.
 */

/** Set on `<html>` for one frame; `styles/globals.css` turns transitions off while it is present. */
export const THEME_SWITCHING_ATTRIBUTE = "data-theme-switching";

type ColorScheme = "light" | "dark";

function schemeFor(mode: string): ColorScheme | null {
  if (mode === "light" || mode === "dark") return mode;
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return null;
}

/**
 * Switches to `mode` ("light", "dark" or "system") and persists it through the
 * next-themes `setTheme`. The class and `color-scheme` change before this returns.
 */
export function switchThemeMode(
  mode: string,
  setTheme: (mode: string) => void,
) {
  const root = document.documentElement;
  const scheme = schemeFor(mode);

  root.setAttribute(THEME_SWITCHING_ATTRIBUTE, "");
  if (scheme) {
    root.classList.remove("light", "dark");
    root.classList.add(scheme);
    root.style.colorScheme = scheme;
  }
  setTheme(mode);

  // The next frame's style pass runs with transitions still off, so the new
  // colours land without animating. Release on the frame after that one.
  // Nothing is read here: a style read inside the click would stall the handler.
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      root.removeAttribute(THEME_SWITCHING_ATTRIBUTE),
    ),
  );
}
