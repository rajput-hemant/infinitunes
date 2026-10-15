import Link from "next/link";
import { Suspense } from "react";

import { AuthIntro } from "../_components/auth-intro";
import { AuthFormSkeleton } from "../_components/auth-skeleton";
import { authLinkStyles } from "../_components/field-styles";
import { LoginForm } from "../_components/login-form";
import { SignedInRedirect } from "../_components/signed-in-redirect";

export const metadata = {
  title: "Login",
  description: "Login to your account",
};

export default function LoginPage() {
  return (
    <div className="grid gap-4">
      <Suspense fallback={null}>
        <SignedInRedirect />
      </Suspense>

      <AuthIntro
        title="Welcome back"
        description="Log in to sync your library across devices."
      />

      <Suspense fallback={<AuthFormSkeleton fields={2} passkey />}>
        <LoginForm />
      </Suspense>

      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className={authLinkStyles}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
