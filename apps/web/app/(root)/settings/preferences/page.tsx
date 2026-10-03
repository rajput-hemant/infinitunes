import type { Lang } from "@infinitunes/types";
import { cookies } from "next/headers";

import { LibraryHeading } from "~/components/library/library-section";

import { PreferenceSettings } from "../_components/preference-settings";

export const metadata = {
  title: "Preferences Settings",
  description:
    "Configure your preferences like language, music stream, download quality, etc.",
};

export default async function Page() {
  const cookieStore = await cookies();
  const languages = cookieStore.get("language")?.value?.split(",") ?? [];

  return (
    <div className="space-y-4">
      <LibraryHeading
        title="Preferences"
        description="Configure your preferences like language, music stream, download quality, etc."
        className="border-b p-4"
      />

      <PreferenceSettings initialLanguages={languages as Lang[]} />
    </div>
  );
}
