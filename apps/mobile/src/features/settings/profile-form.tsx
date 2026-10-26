import { profileSchema } from "@infinitunes/auth/schemas";
import { router } from "expo-router";
import { useRef, useState } from "react";

import { EmailField } from "~/components/form/email-field";
import { FormError, useFocusOnRefusal } from "~/components/form/form-error";
import { FormField } from "~/components/form/form-field";
import type { TextInputHandle } from "~/components/form/form-field";
import { FormScreen } from "~/components/form/form-screen";
import { PasswordField } from "~/components/form/password-field";
import { useSchemaForm } from "~/components/form/use-schema-form";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { trpcClient } from "~/lib/trpc";
import { usePending } from "~/lib/use-pending";

import { refreshSession } from "./end-session";
import { mutationFailure } from "./mutation-failure";

type ProfileFormProps = {
  user: { name?: string | null; email: string };
};

/**
 * Edits the display name and email. Changing the email asks for the current
 * password (the server checks it; accounts without a password need a fresh
 * sign-in instead), so that field only appears once the email differs. The
 * email itself does not change on save: the server mails a link to the new
 * address and swaps it only when that is opened, so the form then tells the
 * listener to check that inbox.
 */
export function ProfileForm({ user }: ProfileFormProps) {
  const emailInput = useRef<TextInputHandle>(null);
  const passwordInput = useRef<TextInputHandle>(null);
  const { values, errors, setValue, validate } = useSchemaForm({
    schema: profileSchema,
    initialValues: { name: user.name ?? "", email: user.email },
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const { pending, run } = usePending();
  const [serverError, setServerError] = useState<string>();
  const [sentTo, setSentTo] = useState<string>();
  const emailChanged = values.email.toLowerCase() !== user.email.toLowerCase();
  useFocusOnRefusal(
    emailChanged ? passwordInput : emailInput,
    serverError,
    pending,
  );

  function submit() {
    const profile = validate();
    if (!profile || pending) return;
    void run(async () => {
      const failure = await mutationFailure(async () => {
        if (!emailChanged || profile.name !== user.name) {
          await trpcClient.user.updateUser.mutate({ name: profile.name });
        }
        if (emailChanged) {
          await trpcClient.user.requestEmailChange.mutate({
            email: profile.email,
            currentPassword: currentPassword || undefined,
          });
        }
      });
      setServerError(failure ?? undefined);
      if (failure) return;
      refreshSession();
      if (emailChanged) setSentTo(profile.email);
      else router.back();
    });
  }

  if (sentTo) {
    return (
      <FormScreen>
        <Text accessibilityRole="alert">
          {`If ${sentTo} is free, we sent it a link. Your email changes once you open it.`}
        </Text>
        <Button label="Done" onPress={() => router.back()} />
      </FormScreen>
    );
  }

  return (
    <FormScreen>
      <FormField
        label="Name"
        value={values.name}
        onChangeText={(text) => setValue("name", text)}
        error={errors.name}
        editable={!pending}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => emailInput.current?.focus()}
      />
      <EmailField
        ref={emailInput}
        value={values.email}
        onChangeText={(text) => setValue("email", text)}
        error={errors.email}
        editable={!pending}
        returnKeyType={emailChanged ? "next" : "done"}
        onSubmitEditing={
          emailChanged ? () => passwordInput.current?.focus() : submit
        }
      />
      {emailChanged ? (
        <PasswordField
          ref={passwordInput}
          purpose="current"
          label="Current password"
          hint="Needed to change your email. Leave it blank if you have no password. We send a link to the new address to confirm it."
          value={currentPassword}
          onChangeText={setCurrentPassword}
          editable={!pending}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      ) : null}
      <FormError message={serverError} />
      <Button
        label={pending ? "Saving..." : "Save profile"}
        disabled={pending}
        onPress={submit}
      />
    </FormScreen>
  );
}
