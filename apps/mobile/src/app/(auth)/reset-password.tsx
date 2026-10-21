import { useLocalSearchParams } from "expo-router";

import { AuthScreen } from "~/features/auth/auth-screen";
import { ResetPasswordForm } from "~/features/auth/reset-password-form";

/** A query value from a link, which repeats a key as an array: only a single string counts. */
const single = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{
    token?: string | string[];
    error?: string | string[];
  }>();

  return (
    <AuthScreen
      title="Reset password"
      description="Choose a new password for your account."
    >
      <ResetPasswordForm
        token={single(params.token)}
        linkError={Array.isArray(params.error) ? "invalid" : params.error}
      />
    </AuthScreen>
  );
}
