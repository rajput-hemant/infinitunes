import type { ThemeConfig } from "@infinitunes/types";

import { serializeThemeConfig } from "~/lib/theme-config";

import { themeConfigToHtml } from "./html";

/**
 * The `theme-config` cookie value: the config's non-default fields plus the
 * `html` field the pre-paint script in `lib/theme-script.ts` applies (`a` =
 * `<html>` attributes, `s` = custom properties). `parseThemeConfig` ignores
 * `html`, so it is derived data and never trusted on the server.
 */
export function serializeThemeCookie(config: ThemeConfig): string {
  const { attributes, style } = themeConfigToHtml(config);
  return JSON.stringify({
    ...JSON.parse(serializeThemeConfig(config)),
    html: { a: attributes, s: style },
  });
}
