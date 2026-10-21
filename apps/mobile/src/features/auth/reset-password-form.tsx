import { PASSWORD_HINT, resetPasswordSchema } from "@infinitunes/auth/schemas";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { View } from "react-native";
import { toast } from "sonner-native";

import type { TextInputHandle } from "~/components/form/form-field";
import { FormLink } from "~/components/form/form-link";
import { PasswordField } from "~/components/form/password-field";
import { useSchemaForm } from "~/components/form/use-schema-form";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { authClient } from "~/lib/auth-client";
import { authFailure } from "~/lib/auth-failure";
import { usePending } from "~/lib/use-pending";

function InvalidLink() {
  return (
    <View className="gap-4" accessibilityRole="alert">
      <Text tone="error">
        This reset link is invalid or has expired. Links work once and last for
        1 hour.
      </Text>
      <FormLink href="/forgot-password" replace>
        Request a new link
      </FormLink>
    </View>
  );
}

type ResetPasswordFormProps = {
  /** From the emailed link; a link without one is invalid. */
  token: string | undefined;
  /** Set by the server when it rejected the link before opening the app. */
  linkError: string | undefined;
};

/** Sets a new password from an emailed reset link. */
export function ResetPasswordForm({
  token,
  linkError,
}: ResetPasswordFormProps) {
  const confirmInput = useRef<TextInputHandle>(null);
  const [tokenRejected, setTokenRejected] = useState(false);
  const { values, errors, setValue, validate } = useSchemaForm({
    schema: resetPasswordSchema,
    initialValues: { password: "", confirmPassword: "" },
  });
  const { pending, run } = usePending();

  if (!token || linkError || tokenRejected) return <InvalidLink />;

  function submit() {
    const reset = validate();
    if (!reset || pending || !token) return;
    void run(async () => {
      const failure = await authFailure(() =>
        authClient.resetPassword({ newPassword: reset.password, token }),
      );
      if (failure?.code === "INVALID_TOKEN") setTokenRejected(true);
      else if (failure) toast.error(failure.message);
      else {
        toast.success("Password reset. Please sign in with your new password.");
        router.replace("/login");
      }
    });
  }

  return (
    <View className="gap-4">
      <PasswordField
        purpose="new"
        label="New password"
        value={values.password}
        onChangeText={(text) => setValue("password", text)}
        error={errors.password}
        hint={PASSWORD_HINT}
        editable={!pending}
        returnKeyType="next"
        onSubmitEditing={() => confirmInput.current?.focus()}
      />
      <PasswordField
        ref={confirmInput}
        purpose="new"
        label="Confirm new password"
        value={values.confirmPassword}
        onChangeText={(text) => setValue("confirmPassword", text)}
        error={errors.confirmPassword}
        editable={!pending}
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <Button
        label={pending ? "Resetting..." : "Reset password"}
        disabled={pending}
        onPress={submit}
        className="disabled:opacity-50"
      />
    </View>
  );
}
