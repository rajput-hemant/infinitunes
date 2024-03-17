import { ResetPasswordForm } from "../_components/reset-password-form";

export const metadata = {
  title: "Reset Password",
  description: "Reset your password",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="font-heading text-3xl drop-shadow-xl dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-4xl">
        Reset Password
      </h1>

      <p className="text-sm text-muted-foreground">
        Enter your new password below.
      </p>

      <ResetPasswordForm />
    </div>
  );
}
