import { useLocalSearchParams } from "expo-router";

import { parseLang } from "./languages";

/** The `?lang=` filter of a list screen, `undefined` for all languages. */
export function useLangParam() {
  const { lang } = useLocalSearchParams<{ lang?: string }>();
  return parseLang(lang);
}
