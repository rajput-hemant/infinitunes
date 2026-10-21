import { forgotPasswordSchema } from "@infinitunes/auth/schemas";
import { useState } from "react";
import { View } from "react-native";
import { toast } from "sonner-native";

import { EmailField } from "~/components/form/email-field";
import { FormLink } from "~/components/form/form-link";
import { useSchemaForm } from "~/components/form/use-schema-form";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { authClient } from "~/lib/auth-client";
import { authFailure } from "~/lib/auth-failure";
import { env } from "~/lib/env";
import { usePending } from "~/lib/use-pending";

/** Shown for every valid submission, so the screen never reveals which emails have accounts. */
export const FORGOT_PASSWORD_MESSAGE =
  "If an account exists for that email, we sent a link to reset your password. The link expires in 1 hour.";

/**
 * The emailed link opens the web's reset page: the server rejects redirects
 * to the app's custom scheme, which any installed app could claim.
 */
const RESET_PAGE_URL = `${env.apiUrl}/reset-password`;

/** Requests the reset email. */
export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const { values, errors, setValue, validate } = useSchemaForm({
    schema: forgotPasswordSchema,
    initialValues: { email: "" },
  });
  const { pending, run } = usePending();

  function submit() {
    const request = validate();
    if (!request || pending) return;
    void run(async () => {
      const failure = await authFailure(() =>
        authClient.requestPasswordReset({
          email: request.email,
          redirectTo: RESET_PAGE_URL,
        }),
      );
      if (failure) toast.error(failure.message);
      else setSent(true);
    });
  }

  if (sent) {
    return (
      <View className="gap-4">
        <Text tone="muted" accessibilityRole="alert">
          {FORGOT_PASSWORD_MESSAGE}
        </Text>
        <FormLink href="/login" replace>
          Back to sign in
        </FormLink>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <EmailField
        value={values.email}
        onChangeText={(text) => setValue("email", text)}
        error={errors.email}
        editable={!pending}
        returnKeyType="send"
        onSubmitEditing={submit}
      />
      <Button
        label={pending ? "Sending..." : "Send reset link"}
        disabled={pending}
        onPress={submit}
        className="disabled:opacity-50"
      />
    </View>
  );
}
