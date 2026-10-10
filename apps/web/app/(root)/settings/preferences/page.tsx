import { cookies } from "next/headers";

import { parseLanguageCookie } from "../_components/language-options";
import { PreferenceSettings } from "../_components/preference-settings";

export const metadata = {
  title: "Preferences Settings",
  description:
    "Configure your preferences like language, music stream, download quality, etc.",
};

export default async function Page() {
  const cookieStore = await cookies();
  const languages = parseLanguageCookie(cookieStore.get("language")?.value);

  return <PreferenceSettings initialLanguages={languages} />;
}
