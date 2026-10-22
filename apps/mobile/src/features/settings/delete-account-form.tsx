import { useRef, useState } from "react";

import { FormError, useFocusOnRefusal } from "~/components/form/form-error";
import { FormField } from "~/components/form/form-field";
import type { TextInputHandle } from "~/components/form/form-field";
import { FormScreen } from "~/components/form/form-screen";
import { PasswordField } from "~/components/form/password-field";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { trpcClient } from "~/lib/trpc";
import { usePending } from "~/lib/use-pending";

import { forgetDeletedAccount } from "./end-session";
import { mutationFailure } from "./mutation-failure";

/** The phrase the web asks for before it enables deletion. */
export const DELETE_CONFIRMATION = "DELETE MY ACCOUNT";

/**
 * Permanently deletes the account and everything saved to it. Accounts with
 * a password enter it; passkey or OAuth accounts leave it blank if they
 * signed in recently, and the server says when they must sign in again.
 */
export function DeleteAccountForm() {
  const passwordInput = useRef<TextInputHandle>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const { pending, run } = usePending();
  const [serverError, setServerError] = useState<string>();
  useFocusOnRefusal(passwordInput, serverError, pending);
  const confirmed = confirmation === DELETE_CONFIRMATION;

  function submit() {
    if (!confirmed || pending) return;
    void run(async () => {
      const failure = await mutationFailure(() =>
        trpcClient.user.deleteUser.mutate({ password: password || undefined }),
      );
      setServerError(failure ?? undefined);
      if (failure) return;
      // The screen guard returns to the settings list once the session is gone.
      await forgetDeletedAccount();
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
        ref={passwordInput}
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
      <FormError message={serverError} />
      <Button
        label={pending ? "Deleting..." : "Delete account"}
        disabled={!confirmed || pending}
        onPress={submit}
        variant="destructive"
      />
    </FormScreen>
  );
}
