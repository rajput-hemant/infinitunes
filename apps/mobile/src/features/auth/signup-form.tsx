import { PASSWORD_HINT, signUpSchema } from "@infinitunes/auth/schemas";
import { useRef } from "react";
import { View } from "react-native";
import { toast } from "sonner-native";

import { EmailField } from "~/components/form/email-field";
import type { TextInputHandle } from "~/components/form/form-field";
import { FormLink } from "~/components/form/form-link";
import { PasswordField } from "~/components/form/password-field";
import { useSchemaForm } from "~/components/form/use-schema-form";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";
import { authFailure } from "~/lib/auth-failure";
import { usePending } from "~/lib/use-pending";

/**
 * Creates the account and signs it in (no email verification, like the web);
 * the `(auth)` layout leaves the screens once the session exists. The display
 * name starts as the part of the email before the `@`, as on the web.
 */
export function SignUpForm() {
  const passwordInput = useRef<TextInputHandle>(null);
  const confirmInput = useRef<TextInputHandle>(null);
  const { values, errors, setValue, validate } = useSchemaForm({
    schema: signUpSchema,
    initialValues: { email: "", password: "", confirmPassword: "" },
  });
  const { pending, run } = usePending();

  function submit() {
    const account = validate();
    if (!account || pending) return;
    void run(async () => {
      const failure = await authFailure(() =>
        authClient.signUp.email({
          email: account.email,
          password: account.password,
          name: account.email.split("@")[0],
        }),
      );
      if (failure) toast.error(failure.message);
      else toast.success("Account created");
    });
  }

  return (
    <View className="gap-4">
      <EmailField
        value={values.email}
        onChangeText={(text) => setValue("email", text)}
        error={errors.email}
        editable={!pending}
        returnKeyType="next"
        onSubmitEditing={() => passwordInput.current?.focus()}
      />
      <PasswordField
        ref={passwordInput}
        purpose="new"
        label="Password"
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
        label="Confirm password"
        value={values.confirmPassword}
        onChangeText={(text) => setValue("confirmPassword", text)}
        error={errors.confirmPassword}
        editable={!pending}
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <Button
        label={pending ? "Creating account..." : "Sign up"}
        disabled={pending}
        onPress={submit}
        className="disabled:opacity-50"
      />
      <View className="items-center">
        <FormLink href="/login" replace>
          Already have an account? Sign in
        </FormLink>
      </View>
    </View>
  );
}
