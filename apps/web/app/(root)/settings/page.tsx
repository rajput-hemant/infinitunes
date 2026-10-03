import { Ban } from "lucide-react";

import {
  LibraryEmpty,
  LibraryHeading,
} from "~/components/library/library-section";
import { getUser } from "~/lib/auth";

import { PasskeySettings } from "./_components/passkey-settings";
import { ProfileForm } from "./_components/profile-form";

export const metadata = {
  title: "Profile Settings",
  description: "Edit your profile settings.",
};

export default async function SettingsProfilePage() {
  const user = await getUser();

  if (!user) {
    return (
      <LibraryEmpty
        icon={Ban}
        title="Please sign in to view this page"
        description="Sign in to manage your account, appearance and preferences."
        action={{ href: "/login", label: "Sign in" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <LibraryHeading
        title="Account Settings"
        description="This is how others will see you on the site."
        className="border-b p-4"
      />

      <ProfileForm user={user} />

      <PasskeySettings />
    </div>
  );
}
