import React from "react";

import { SettingsNav } from "./_components/settings-nav";

export default function SettingsLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="grid gap-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl/8 text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, appearance, and preference settings.
        </p>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
        <SettingsNav />

        <div className="grid min-w-0 gap-10">{children}</div>
      </div>
    </div>
  );
}
