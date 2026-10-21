import { DeleteAccountForm } from "~/features/settings/delete-account-form";
import { RequireSession } from "~/features/settings/require-session";

export default function DeleteAccountScreen() {
  return <RequireSession>{() => <DeleteAccountForm />}</RequireSession>;
}
