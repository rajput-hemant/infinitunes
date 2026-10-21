import { useState } from "react";
import { toast } from "sonner-native";

import { FormField } from "~/components/form/form-field";
import { FormScreen } from "~/components/form/form-screen";
import { PasswordField } from "~/components/form/password-field";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { trpcClient } from "~/lib/trpc";
import { usePending } from "~/lib/use-pending";

import { forgetUserData, signOut } from "./end-session";
import { mutationFailure } from "./mutation-failure";

/** The phrase the web asks for before it enables deletion. */
export const DELETE_CONFIRMATION = "DELETE MY ACCOUNT";

/**
 * Permanently deletes the account and everything saved to it. Accounts with
 * a password enter it; passkey or OAuth accounts leave it blank if they
 * signed in recently, and the server says when they must sign in again.
 */
export function DeleteAccountForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const { pending, run } = usePending();
  const confirmed = confirmation === DELETE_CONFIRMATION;

  function submit() {
    if (!confirmed || pending) return;
    void run(async () => {
      const failure = await mutationFailure(() =>
        trpcClient.user.deleteUser.mutate({ password: password || undefined }),
      );
      if (failure) {
        toast.error(failure);
        return;
      }
      // The server session went with the account; this clears the stored copy,
      // and the screen guard then returns to the settings list.
      forgetUserData();
      await signOut();
      toast.success("Account Deleted!");
    });
  }

  return (
    <FormScreen>
      <Text tone="muted">
        Once you delete your account, there is no going back: your profile,
        likes and playlists are removed. Accounts without a password (passkey or
        OAuth) can leave the password blank if they signed in within the last 10
        minutes; otherwise sign in again first.
      </Text>
      <PasswordField
        purpose="current"
        label="Your password"
        hint="Leave it blank if your account has no password."
        value={password}
        onChangeText={setPassword}
        editable={!pending}
        returnKeyType="next"
      />
      <FormField
        label={`Type ${DELETE_CONFIRMATION} to confirm`}
        value={confirmation}
        onChangeText={setConfirmation}
        editable={!pending}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <Button
        label={pending ? "Deleting..." : "Delete account"}
        disabled={!confirmed || pending}
        onPress={submit}
        variant="secondary"
        className="disabled:opacity-50"
      />
    </FormScreen>
  );
}
