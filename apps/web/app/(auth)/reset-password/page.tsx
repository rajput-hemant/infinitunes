import Link from "next/link";
import { Suspense } from "react";

import { AuthIntro } from "../_components/auth-intro";
import { AuthFormSkeleton } from "../_components/auth-skeleton";
import { authLinkStyles } from "../_components/field-styles";
import { ResetPasswordForm } from "../_components/reset-password-form";
import { SignedInRedirect } from "../_components/signed-in-redirect";

export const metadata = {
  title: "Reset Password",
  description: "Choose a new password",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  return (
    <div className="grid gap-4">
      <Suspense fallback={null}>
        <SignedInRedirect searchParams={searchParams} />
      </Suspense>

      <AuthIntro
        title="Reset password"
        description="Choose a new password for your account."
      />

      <Suspense fallback={<AuthFormSkeleton fields={2} social={false} />}>
        <ResetPasswordForm />
      </Suspense>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/login" className={authLinkStyles}>
          Back to log in
        </Link>
      </p>
    </div>
  );
}
