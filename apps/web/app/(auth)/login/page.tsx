import Link from "next/link";

import { redirectIfSignedIn } from "~/lib/auth-guard";

import { AuthIntro } from "../_components/auth-intro";
import { authLinkStyles } from "../_components/field-styles";
import { LoginForm } from "../_components/login-form";

export const metadata = {
  title: "Login",
  description: "Login to your account",
};

export default async function LoginPage() {
  await redirectIfSignedIn();

  return (
    <div className="grid gap-4">
      <AuthIntro
        title="Welcome back"
        description="Log in to sync your library across devices."
      />

      <LoginForm />

      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className={authLinkStyles}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
