import { AuthScreen } from "~/features/auth/auth-screen";
import { ForgotPasswordForm } from "~/features/auth/forgot-password-form";

export default function ForgotPasswordScreen() {
  return (
    <AuthScreen
      title="Forgot your password?"
      description="Enter your email and we will send you a link to reset it."
    >
      <ForgotPasswordForm />
    </AuthScreen>
  );
}
