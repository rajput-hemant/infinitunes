import Link from "next/link";

import { redirectIfSignedIn } from "~/lib/auth-guard";

import { AuthIntro } from "../_components/auth-intro";
import { ForgotPasswordForm } from "../_components/forgot-password-form";

export const metadata = {
  title: "Forgot Password",
  description: "Request a link to reset your password",
};

export default async function ForgotPasswordPage() {
  await redirectIfSignedIn();

  return (
    <div className="space-y-4">
      <AuthIntro
        title="Forgot password"
        description="We will email you a link to reset it."
      />

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
