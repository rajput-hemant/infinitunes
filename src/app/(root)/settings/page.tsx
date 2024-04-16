import Link from "next/link";
import { Ban } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { ProfileForm } from "./_components/profile-form";

export const metadata = {
  title: "Profile Settings",
  description: "Edit your profile settings.",
};

export default async function SettingsProfilePage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center p-20">
        <div className="size-full rounded-md border-2 border-dashed p-4">
          <div className="flex size-full flex-col items-center justify-center gap-4 rounded-md bg-muted">
            <Ban className="size-32 text-destructive" />
            <p className="text-3xl font-bold">
              Please sign in to view this page.
            </p>

            <Link
              href="/login"
              className={buttonVariants({ variant: "outline" })}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1 border-b p-4">
        <h2 className="font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
          Account Settings
        </h2>

        <p className="text-sm text-muted-foreground">
          This is how others will see you on the site.
        </p>
      </div>

      <ProfileForm user={user} />
    </div>
  );
}
