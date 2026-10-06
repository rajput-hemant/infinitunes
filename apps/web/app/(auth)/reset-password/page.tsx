import { redirectIfSignedIn } from "~/lib/auth-guard";

import { ResetPasswordForm } from "../_components/reset-password-form";

export const metadata = {
  title: "Reset Password",
  description: "Choose a new password",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  // The emailed token proves intent, so a signed-in user may use the link;
  // without one this page is only for signed-out visitors.
  if (!(await searchParams).token) await redirectIfSignedIn();

  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="font-heading text-3xl dark:drop-shadow-xl text-foreground sm:text-4xl">
        Reset Password
      </h1>

      <p className="text-sm text-muted-foreground">
        Choose a new password for your account.
      </p>

      <ResetPasswordForm />
    </div>
  );
}
