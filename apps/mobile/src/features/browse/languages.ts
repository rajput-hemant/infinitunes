import { LANGUAGES } from "@infinitunes/types";
import type { Lang } from "@infinitunes/types";

/** Narrows an untrusted route param to a supported language. */
export function parseLang(value: string | undefined): Lang | undefined {
  return LANGUAGES.find((lang) => lang === value);
}

export function languageLabel(lang: Lang): string {
  return `${lang.charAt(0).toUpperCase()}${lang.slice(1)}`;
}
