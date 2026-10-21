import { useLocalSearchParams } from "expo-router";

import { AuthScreen } from "~/features/auth/auth-screen";
import { ResetPasswordForm } from "~/features/auth/reset-password-form";

export default function ResetPasswordScreen() {
  const { token, error } = useLocalSearchParams<{
    token?: string;
    error?: string;
  }>();

  return (
    <AuthScreen
      title="Reset password"
      description="Choose a new password for your account."
    >
      <ResetPasswordForm token={token} linkError={error} />
    </AuthScreen>
  );
}
