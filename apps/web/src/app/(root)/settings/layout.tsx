import React from "react";

import { SideNavbar } from "./_components/side-navbar";

export default function SettingsLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 space-y-1">
        <h1 className="font-heading text-2xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
          Settings
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Manage your account, appearance, and preference settings.
        </p>
      </div>

      <div className="flex h-full flex-1 flex-col border-t lg:flex-row">
        <aside className="pt-2 lg:max-w-64 lg:border-r lg:pr-4 lg:pt-4 xl:w-1/5">
          <SideNavbar />
        </aside>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
