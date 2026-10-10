import Link from "next/link";

import { redirectIfSignedIn } from "~/lib/auth-guard";
import { asRoute } from "~/lib/utils";

import { AuthIntro } from "../_components/auth-intro";
import { SignUpForm } from "../_components/signup-form";

export const metadata = {
  title: "Sign Up",
  description: "Create a new account",
};

export default async function SignUpPage() {
  await redirectIfSignedIn();

  return (
    <div className="space-y-4">
      <AuthIntro
        title="Create your account"
        description="Free forever. No credit card needed."
      />

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
