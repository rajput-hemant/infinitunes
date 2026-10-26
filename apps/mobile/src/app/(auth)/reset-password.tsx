import { useLocalSearchParams } from "expo-router";

import { AuthScreen } from "~/features/auth/auth-screen";
import { ResetPasswordForm } from "~/features/auth/reset-password-form";
import { single } from "~/lib/params";

/** A repeated `token` is ambiguous, so none counts (unlike the lenient `single`). */
const onlyOne = (value: string | string[] | undefined) =>
  Array.isArray(value) ? undefined : single(value);

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
        token={onlyOne(params.token)}
        linkError={Array.isArray(params.error) ? "invalid" : params.error}
      />
    </AuthScreen>
  );
}
