import Link from "next/link";
import { Suspense } from "react";

import { AuthIntro } from "../_components/auth-intro";
import { authLinkStyles } from "../_components/field-styles";
import { ForgotPasswordForm } from "../_components/forgot-password-form";
import { SignedInRedirect } from "../_components/signed-in-redirect";

export const metadata = {
  title: "Forgot Password",
  description: "Request a link to reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="grid gap-4">
      <Suspense fallback={null}>
        <SignedInRedirect />
      </Suspense>

      <AuthIntro
        title="Forgot password"
        description="We will email you a link to reset it."
      />

      <ForgotPasswordForm />

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/login" className={authLinkStyles}>
          Back to log in
        </Link>
      </p>
    </div>
  );
}
