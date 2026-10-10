import Link from "next/link";

import { redirectIfSignedIn } from "~/lib/auth-guard";

import { AuthIntro } from "../_components/auth-intro";
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
  if (!(await searchParams).token) await redirectIfSignedIn();

  return (
    <div className="space-y-4">
      <AuthIntro
        title="Reset password"
        description="Choose a new password for your account."
      />

      <ResetPasswordForm />

      <p className="text-center text-xs text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to log in
        </Link>
      </p>
    </div>
  );
}
