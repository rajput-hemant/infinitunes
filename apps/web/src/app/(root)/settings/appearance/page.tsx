import React from "react";
import { cookies } from "next/headers";

import type { ThemeConfig } from "@/types";

import { AppearanceSettings } from "../_components/appearance-settings";

export const metadata = {
  title: "Appearance Settings",
  description: "Customize the appearance of the app.",
};

export default async function Page() {
  const cookieStore = await cookies();
  const themeConfig = cookieStore.get("theme-config");

  const { theme, radius } = JSON.parse(
    themeConfig?.value ?? '{"theme":"default","radius":"default"}'
  ) as ThemeConfig;

  return (
    <div className="space-y-4">
      <div className="space-y-1 border-b p-4">
        <h2 className="font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
          Appearance
        </h2>

        <p className="text-sm text-muted-foreground">
          Customize the appearance of the app. Automatically switch between day
          and night themes.
        </p>
      </div>

      <AppearanceSettings theme={theme} radius={radius} />
    </div>
  );
}
