import { PASSWORD_HINT, changePasswordSchema } from "@infinitunes/auth/schemas";
import { router } from "expo-router";
import { useRef } from "react";
import { toast } from "sonner-native";

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
  const newPasswordInput = useRef<TextInputHandle>(null);
  const { values, errors, setValue, validate } = useSchemaForm({
    schema: changePasswordSchema,
    initialValues: { password: "", newPassword: "" },
  });
  const { pending, run } = usePending();

  function submit() {
    const passwords = validate();
    if (!passwords || pending) return;
    void run(async () => {
      const failure = await mutationFailure(() =>
        trpcClient.user.changePassword.mutate(passwords),
      );
      if (failure) {
        toast.error(failure);
        return;
      }
      toast.success("Password updated");
      router.back();
    });
  }

  return (
    <FormScreen>
      <PasswordField
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
      <Button
        label={pending ? "Updating..." : "Update password"}
        disabled={pending}
        onPress={submit}
        className="disabled:opacity-50"
      />
    </FormScreen>
  );
}
