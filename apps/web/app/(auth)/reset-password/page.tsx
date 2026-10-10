import Link from "next/link";

import { redirectIfSignedIn } from "~/lib/auth-guard";

import { AuthIntro } from "../_components/auth-intro";
import { authLinkStyles } from "../_components/field-styles";
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
    <div className="grid gap-4">
      <AuthIntro
        title="Reset password"
        description="Choose a new password for your account."
      />

      <ResetPasswordForm />

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/login" className={authLinkStyles}>
          Back to log in
        </Link>
      </p>
    </div>
  );
}
