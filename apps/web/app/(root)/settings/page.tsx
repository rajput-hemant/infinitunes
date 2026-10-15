import { Suspense } from "react";

import {
  AccountCards,
  PlaybackCards,
  SecurityCards,
} from "./_components/account-sections";
import {
  AppearanceSettings,
  ResetAppearanceButton,
} from "./_components/appearance-settings";
import { SettingsNav } from "./_components/settings-nav";
import {
  SettingsEmpty,
  SettingsSaveStatus,
  SettingsSearchField,
  SettingsSearchProvider,
} from "./_components/settings-search";
import { SettingsSection } from "./_components/settings-section";
import {
  ActionCardSkeleton,
  PlaybackSkeleton,
  ProfileCardSkeleton,
} from "./_components/settings-skeletons";

export const metadata = {
  title: "Settings",
  description:
    "Manage your account, appearance, playback preferences and security.",
};

/**
 * One page for every setting. The shell (heading, search, rail, section
 * headings, appearance controls) prerenders; the parts that need the visitor
 * or a cookie (account, playback, security) stream in behind skeletons.
 */
export default function SettingsPage() {
  return (
    <SettingsSearchProvider>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
        <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl/8 text-foreground">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account, appearance, and preferences.
            </p>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <SettingsSearchField className="min-w-0 flex-1 sm:flex-none" />
            <SettingsSaveStatus />
          </div>
        </header>

        <div className="flex min-w-0 flex-col gap-4 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start lg:gap-10">
          <SettingsNav />

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-10">
            <SettingsSection
              id="account"
              title="Account"
              description="Profile and sign-in"
            >
              <Suspense fallback={<ProfileCardSkeleton />}>
                <AccountCards />
              </Suspense>
            </SettingsSection>

            <SettingsSection
              id="appearance"
              title="Appearance"
              action={<ResetAppearanceButton />}
            >
              <AppearanceSettings />
            </SettingsSection>

            <SettingsSection
              id="playback"
              title="Playback"
              description="Languages, quality and shortcuts"
            >
              <Suspense fallback={<PlaybackSkeleton />}>
                <PlaybackCards />
              </Suspense>
            </SettingsSection>

            <SettingsSection
              id="security"
              title="Security and danger zone"
              description="Sign-in methods and account removal"
            >
              <Suspense
                fallback={
                  <>
                    <ActionCardSkeleton />
                    <ActionCardSkeleton />
                  </>
                }
              >
                <SecurityCards />
              </Suspense>
            </SettingsSection>

            <SettingsEmpty />
          </div>
        </div>
      </div>
    </SettingsSearchProvider>
  );
}
