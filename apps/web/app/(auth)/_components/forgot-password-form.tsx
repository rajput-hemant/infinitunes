"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@infinitunes/auth/client";
import { forgotPasswordSchema } from "@infinitunes/auth/schemas";
import { GENERIC_MESSAGE } from "@infinitunes/core/user-message";
import { Button } from "@infinitunes/ui/components/button";
import { Loader2, Mail } from "lucide-react";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";

import { EmailField } from "./email-field";
import { authPrimaryButtonStyles } from "./field-styles";

/** Shown for every valid submission, so the page never reveals which emails have accounts. */
export const FORGOT_PASSWORD_MESSAGE =
  "If an account exists for that email, we sent a link to reset your password. The link expires in 1 hour.";

type ForgotPasswordData = z.output<typeof forgotPasswordSchema>;

/** Requests the reset email. Outside the component: the React Compiler bails out on try/finally. */
async function requestReset(
  formData: ForgotPasswordData,
  {
    setBusy,
    setIsSent,
  }: {
    setBusy: (busy: boolean) => void;
    setIsSent: (sent: boolean) => void;
  },
) {
  setBusy(true);

  try {
    const { error } = await authClient.requestPasswordReset({
      email: formData.email,
      redirectTo: "/reset-password",
    });

    if (error?.status === 429) {
      toast.error("Too many requests. Please wait a minute and try again.");
    } else if (error) {
      toast.error(GENERIC_MESSAGE);
    } else {
      setIsSent(true);
    }
  } catch (error) {
    console.error(error);
    toast.error(GENERIC_MESSAGE);
  } finally {
    setBusy(false);
  }
}

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);

  const form = useForm<
    z.input<typeof forgotPasswordSchema>,
    unknown,
    z.output<typeof forgotPasswordSchema>
  >({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(formData: ForgotPasswordData) {
    await requestReset(formData, {
      setBusy: setIsSubmitting,
      setIsSent,
    });
  }

  if (isSent) {
    return (
      <output className="block text-sm text-muted-foreground">
        {FORGOT_PASSWORD_MESSAGE}
      </output>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <EmailField
            field={field}
            fieldState={fieldState}
            autoComplete="email"
            disabled={isSubmitting}
          />
        )}
      />

      <Button
        type="submit"
        disabled={isSubmitting}
        className={authPrimaryButtonStyles}
      >
        {isSubmitting ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Mail className="mr-2 size-4" />
        )}
        Send reset link
      </Button>
    </form>
  );
}
