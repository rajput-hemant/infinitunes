import { isLang } from "@infinitunes/types";
import { useLocalSearchParams } from "expo-router";

/** The `?lang=` filter of a list screen, `undefined` for all languages. */
export function useLangParam() {
  const { lang } = useLocalSearchParams<{ lang?: string }>();
  return isLang(lang) ? lang : undefined;
}
