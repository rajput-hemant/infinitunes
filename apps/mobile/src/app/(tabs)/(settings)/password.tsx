import { PasswordForm } from "~/features/settings/password-form";
import { RequireSession } from "~/features/settings/require-session";

export default function PasswordScreen() {
  return <RequireSession>{() => <PasswordForm />}</RequireSession>;
}
