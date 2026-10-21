import { parseLanguages } from "@infinitunes/types";
import { buttonVariants } from "@infinitunes/ui/components/button";
import { LogIn } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";
import { getViewer } from "~/lib/viewer";

import { PasskeySettings, ProfileForm } from "./account-lazy";
import { DeleteAccountSection } from "./delete-account-section";
import { PreferenceSettings } from "./preference-settings";
import { SettingsCard } from "./settings-card";
import { SettingsRow } from "./settings-row";

/** Guests get a prompt where the account and security forms would be. */
function SignInCard({ title, help }: { title: string; help: string }) {
  return (
    <SettingsCard title={title}>
      <SettingsRow
        label="Sign in to continue"
        help={help}
        keywords={`${title} profile password passkeys delete account sign in log in`}
      >
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "default" }),
            controlStyles.text,
          )}
        >
          <LogIn aria-hidden className="size-4" />
          Sign in
        </Link>
      </SettingsRow>
    </SettingsCard>
  );
}

/** Profile and password, for the signed-in user. Reads the session, so it streams. */
export async function AccountCards() {
  const { user } = await getViewer();

  if (!user) {
    return (
      <SignInCard
        title="Profile and password"
        help="Sign in to edit your profile and change your password."
      />
    );
  }

  return <ProfileForm user={user} />;
}

/** Passkeys and account deletion, for the signed-in user. */
export async function SecurityCards() {
  const { user } = await getViewer();

  if (!user) {
    return (
      <SignInCard
        title="Passkeys and account"
        help="Sign in to manage passkeys or delete your account."
      />
    );
  }

  return (
    <>
      <PasskeySettings />
      <DeleteAccountSection />
    </>
  );
}

/** Playback preferences. The language list comes from a cookie, so this streams. */
export async function PlaybackCards() {
  const cookieStore = await cookies();
  const languages = parseLanguages(cookieStore.get("language")?.value);

  return <PreferenceSettings initialLanguages={languages} />;
}
