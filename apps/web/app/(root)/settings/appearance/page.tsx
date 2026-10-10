import React from "react";

import { LibraryHeading } from "~/components/library/library-section";

import { AppearanceSettings } from "../_components/appearance-settings";

export const metadata = {
  title: "Appearance Settings",
  description: "Customize the appearance of the app.",
};

export default function Page() {
  return (
    <div className="space-y-4">
      <LibraryHeading
        title="Appearance"
        description="Customize the appearance of the app. Automatically switch between day and night themes."
        className="border-b p-4"
      />

      <AppearanceSettings />
    </div>
  );
}
