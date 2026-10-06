import { redirectIfSignedIn } from "~/lib/auth-guard";

import { SignUpForm } from "../_components/signup-form";

export const metadata = {
  title: "Sign Up",
  description: "Create a new account",
};

export default async function SignUpPage() {
  await redirectIfSignedIn();

  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="font-heading text-3xl dark:drop-shadow-md text-foreground sm:text-4xl">
        Create an Account
      </h1>

      <p className="text-sm text-muted-foreground">
        Enter your details to create your account.
      </p>

      <SignUpForm />
    </div>
  );
}
