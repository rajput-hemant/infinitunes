import Link from "next/link";

import { redirectIfSignedIn } from "~/lib/auth-guard";

import { LoginForm } from "../_components/login-form";

export const metadata = {
  title: "Login",
  description: "Login to your account",
};

export default async function LoginPage() {
  await redirectIfSignedIn();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="font-heading text-[1.75rem] font-bold leading-8 tracking-[-0.025em] text-foreground">
          Welcome back
        </h1>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Log in to sync your library across devices.
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
