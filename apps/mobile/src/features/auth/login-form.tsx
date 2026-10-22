import { loginSchema } from "@infinitunes/auth/schemas";
import { useRef, useState } from "react";
import { View } from "react-native";

import { EmailField } from "~/components/form/email-field";
import { FormError, useFocusOnRefusal } from "~/components/form/form-error";
import type { TextInputHandle } from "~/components/form/form-field";
import { FormLink } from "~/components/form/form-link";
import { PasswordField } from "~/components/form/password-field";
import { useSchemaForm } from "~/components/form/use-schema-form";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";
import { authFailure } from "~/lib/auth-failure";
import { usePending } from "~/lib/use-pending";

/**
 * Email and password sign-in. The session store updates on success and the
 * `(auth)` layout then leaves the sign-in screens, so there is no redirect
 * here. No `callbackURL`: the server only accepts web redirects.
 */
export function LoginForm() {
  const emailInput = useRef<TextInputHandle>(null);
  const passwordInput = useRef<TextInputHandle>(null);
  const { values, errors, setValue, validate } = useSchemaForm({
    schema: loginSchema,
    initialValues: { email: "", password: "" },
  });
  const { pending, run } = usePending();
  const [serverError, setServerError] = useState<string>();
  useFocusOnRefusal(emailInput, serverError, pending);

  function submit() {
    const credentials = validate();
    if (!credentials || pending) return;
    void run(async () => {
      const failure = await authFailure(() =>
        authClient.signIn.email(credentials),
      );
      setServerError(failure?.message);
    });
  }

  return (
    <View className="gap-4">
      <EmailField
        ref={emailInput}
        value={values.email}
        onChangeText={(text) => setValue("email", text)}
        error={errors.email}
        editable={!pending}
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordInput.current?.focus()}
      />
      <PasswordField
        ref={passwordInput}
        purpose="current"
        label="Password"
        value={values.password}
        onChangeText={(text) => setValue("password", text)}
        error={errors.password}
        editable={!pending}
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <FormError message={serverError} />
      <Button
        label={pending ? "Signing in..." : "Sign in"}
        disabled={pending}
        onPress={submit}
      />
      <View className="items-center">
        <FormLink href="/forgot-password" tone="muted">
          Forgot password?
        </FormLink>
        <FormLink href="/signup">Don&apos;t have an account? Sign up</FormLink>
      </View>
    </View>
  );
}
