import { ProfileForm } from "~/features/settings/profile-form";
import { RequireSession } from "~/features/settings/require-session";

export default function ProfileScreen() {
  return (
    <RequireSession>{(user) => <ProfileForm user={user} />}</RequireSession>
  );
}
