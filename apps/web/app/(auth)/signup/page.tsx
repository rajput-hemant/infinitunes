import Link from "next/link";
import { Suspense } from "react";

import { AuthIntro } from "../_components/auth-intro";
import { AuthFormSkeleton } from "../_components/auth-skeleton";
import { authLinkStyles } from "../_components/field-styles";
import { SignedInRedirect } from "../_components/signed-in-redirect";
import { SignUpForm } from "../_components/signup-form";

export const metadata = {
  title: "Sign Up",
  description: "Create a new account",
};

export default function SignUpPage() {
  return (
    <div className="grid gap-4">
      <Suspense fallback={null}>
        <SignedInRedirect />
      </Suspense>

      <AuthIntro
        title="Create your account"
        description="Free forever. No credit card needed."
      />

      <Suspense fallback={<AuthFormSkeleton fields={3} />}>
        <SignUpForm />
      </Suspense>

      <div className="grid gap-4 text-center text-xs text-muted-foreground">
        <p>
          Already have an account?{" "}
          <Link href="/login" className={authLinkStyles}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
