import { PASSWORD_HINT, changePasswordSchema } from "@infinitunes/auth/schemas";
import { router } from "expo-router";
import { useRef, useState } from "react";

import { FormError, useFocusOnRefusal } from "~/components/form/form-error";
import type { TextInputHandle } from "~/components/form/form-field";
import { FormScreen } from "~/components/form/form-screen";
import { PasswordField } from "~/components/form/password-field";
import { useSchemaForm } from "~/components/form/use-schema-form";
import { Button } from "~/components/ui/button";
import { trpcClient } from "~/lib/trpc";
import { usePending } from "~/lib/use-pending";

import { mutationFailure } from "./mutation-failure";

/**
 * Changes the signed-in account's password. The server signs every other
 * device out and keeps this one.
 */
export function PasswordForm() {
  const currentInput = useRef<TextInputHandle>(null);
  const newPasswordInput = useRef<TextInputHandle>(null);
  const { values, errors, setValue, validate } = useSchemaForm({
    schema: changePasswordSchema,
    initialValues: { password: "", newPassword: "" },
  });
  const { pending, run } = usePending();
  const [serverError, setServerError] = useState<string>();
  useFocusOnRefusal(currentInput, serverError, pending);

  function submit() {
    const passwords = validate();
    if (!passwords || pending) return;
    void run(async () => {
      const failure = await mutationFailure(() =>
        trpcClient.user.changePassword.mutate(passwords),
      );
      setServerError(failure ?? undefined);
      if (failure) return;
      router.back();
    });
  }

  return (
    <FormScreen>
      <PasswordField
        ref={currentInput}
        purpose="current"
        label="Current password"
        value={values.password}
        onChangeText={(text) => setValue("password", text)}
        error={errors.password}
        editable={!pending}
        returnKeyType="next"
        onSubmitEditing={() => newPasswordInput.current?.focus()}
      />
      <PasswordField
        ref={newPasswordInput}
        purpose="new"
        label="New password"
        value={values.newPassword}
        onChangeText={(text) => setValue("newPassword", text)}
        error={errors.newPassword}
        hint={PASSWORD_HINT}
        editable={!pending}
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <FormError message={serverError} />
      <Button
        label={pending ? "Updating..." : "Update password"}
        disabled={pending}
        onPress={submit}
      />
    </FormScreen>
  );
}
