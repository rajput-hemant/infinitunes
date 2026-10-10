import { LANGUAGES } from "@infinitunes/types";
import type { Lang } from "@infinitunes/types";

export function isLang(value: string): value is Lang {
  return LANGUAGES.some((lang) => lang === value);
}

/** The `language` cookie is a comma-separated list of `Lang` values. */
export function parseLanguageCookie(value: string | undefined): Lang[] {
  return (value ?? "").split(",").filter(isLang);
}
