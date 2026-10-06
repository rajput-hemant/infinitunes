import { redirectIfSignedIn } from "~/lib/auth-guard";

import { ForgotPasswordForm } from "../_components/forgot-password-form";

export const metadata = {
  title: "Forgot Password",
  description: "Request a link to reset your password",
};

export default async function ForgotPasswordPage() {
  await redirectIfSignedIn();

  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="font-heading text-3xl dark:drop-shadow-md text-foreground sm:text-4xl md:text-5xl">
        Forgot Password
      </h1>

      <p className="text-sm text-muted-foreground">
        Enter your email and we will send you a link to reset your password.
      </p>

      <ForgotPasswordForm />
    </div>
  );
}
