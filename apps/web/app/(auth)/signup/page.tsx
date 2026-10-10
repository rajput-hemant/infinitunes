import Link from "next/link";

import { redirectIfSignedIn } from "~/lib/auth-guard";
import { asRoute } from "~/lib/utils";

import { SignUpForm } from "../_components/signup-form";

export const metadata = {
  title: "Sign Up",
  description: "Create a new account",
};

export default async function SignUpPage() {
  await redirectIfSignedIn();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="font-heading text-[1.75rem] font-bold leading-8 tracking-[-0.025em] text-foreground">
          Create your account
        </h1>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Free forever. No credit card needed.
        </p>
      </div>

      <SignUpForm />

      <div className="space-y-2 text-center text-xs text-muted-foreground">
        <p>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </p>
        <p>
          By continuing you agree to the{" "}
          <Link
            href={asRoute("/terms")}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href={asRoute("/privacy")}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
