import { ResetPasswordForm } from "../_components/reset-password-form";

export const metadata = {
  title: "Reset Password",
  description: "Choose a new password",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="font-heading text-3xl drop-shadow-xl text-foreground sm:text-4xl">
        Reset Password
      </h1>

      <p className="text-sm text-muted-foreground">
        Choose a new password for your account.
      </p>

      <ResetPasswordForm />
    </div>
  );
}
