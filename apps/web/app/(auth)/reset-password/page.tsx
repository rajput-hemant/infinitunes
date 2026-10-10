import Link from "next/link";

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
  if (!(await searchParams).token) await redirectIfSignedIn();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="font-heading text-[1.75rem] font-bold leading-8 tracking-[-0.025em] text-foreground">
          Reset password
        </h1>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Choose a new password for your account.
        </p>
      </div>

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
