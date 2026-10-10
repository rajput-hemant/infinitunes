import Link from "next/link";

import { redirectIfSignedIn } from "~/lib/auth-guard";

import { ForgotPasswordForm } from "../_components/forgot-password-form";

export const metadata = {
  title: "Forgot Password",
  description: "Request a link to reset your password",
};

export default async function ForgotPasswordPage() {
  await redirectIfSignedIn();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="font-heading text-[1.75rem] font-bold leading-8 tracking-[-0.025em] text-foreground">
          Forgot password
        </h1>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          We will email you a link to reset it.
        </p>
      </div>

      <ForgotPasswordForm />

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
