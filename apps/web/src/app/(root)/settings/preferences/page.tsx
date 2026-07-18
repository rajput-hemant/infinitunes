import { cookies } from "next/headers";

import type { Lang } from "@/types";

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
      <div className="space-y-1 border-b p-4">
        <h2 className="font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
          Preferences
        </h2>

        <p className="text-sm text-muted-foreground">
          Configure your preferences like language, music stream, download
          quality, etc.
        </p>
      </div>

      <PreferenceSettings initialLanguages={languages as Lang[]} />
    </div>
  );
}
