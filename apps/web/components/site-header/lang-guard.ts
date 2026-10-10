import type { Lang } from "@infinitunes/types";
import { LANGUAGES } from "@infinitunes/types";

/** Narrows an untrusted string (cookie, query param) to a supported language. */
export function isLang(value: string): value is Lang {
  return LANGUAGES.some((lang) => lang === value);
}
