import type { ThemeConfig } from "@infinitunes/types";
import { cookies } from "next/headers";
import React from "react";

import { LibraryHeading } from "~/components/library/library-section";

import { AppearanceSettings } from "../_components/appearance-settings";

export const metadata = {
  title: "Appearance Settings",
  description: "Customize the appearance of the app.",
};

export default async function Page() {
  const cookieStore = await cookies();
  const themeConfig = cookieStore.get("theme-config");

  const { theme, radius } = JSON.parse(
    themeConfig?.value ?? '{"theme":"default","radius":"default"}',
  ) as ThemeConfig;

  return (
    <div className="space-y-4">
      <LibraryHeading
        title="Appearance"
        description="Customize the appearance of the app. Automatically switch between day and night themes."
        className="border-b p-4"
      />

      <AppearanceSettings theme={theme} radius={radius} />
    </div>
  );
}
